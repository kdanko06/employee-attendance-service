# AWS ECS Fargate Deployment Guide

This guide covers deploying the Employee Attendance Service to AWS using ECR, ECS Fargate, RDS PostgreSQL, and ElastiCache Redis.

## Architecture Overview

- **Container**: Docker image stored in Amazon ECR
- **Compute**: ECS Fargate (serverless containers)
- **Database**: Amazon RDS PostgreSQL
- **Cache/Logs**: Amazon ElastiCache Redis
- **Load Balancer**: Application Load Balancer (ALB)
- **Networking**: VPC with public and private subnets
- **Secrets**: AWS Secrets Manager

## Prerequisites

- AWS CLI installed and configured
- Docker installed
- AWS account with appropriate permissions
- Domain name (optional, for HTTPS)

## Step 1: Create ECR Repository

```bash
# Create repository
aws ecr create-repository \
  --repository-name employee-attendance-service \
  --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

## Step 2: Build and Push Docker Image

```bash
# Build image
docker build -t employee-attendance-service .

# Tag image
docker tag employee-attendance-service:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/employee-attendance-service:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/employee-attendance-service:latest
```

## Step 3: Create VPC and Networking

### Create VPC
```bash
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=attendance-vpc}]'
```

### Create Subnets

Public Subnets (for ALB):
```bash
aws ec2 create-subnet \
  --vpc-id <vpc-id> \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-1}]'

aws ec2 create-subnet \
  --vpc-id <vpc-id> \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=public-subnet-2}]'
```

Private Subnets (for ECS, RDS, Redis):
```bash
aws ec2 create-subnet \
  --vpc-id <vpc-id> \
  --cidr-block 10.0.10.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-1}]'

aws ec2 create-subnet \
  --vpc-id <vpc-id> \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1b \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=private-subnet-2}]'
```

### Internet Gateway and NAT Gateway
```bash
# Create Internet Gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=attendance-igw}]'

# Attach to VPC
aws ec2 attach-internet-gateway \
  --vpc-id <vpc-id> \
  --internet-gateway-id <igw-id>

# Create NAT Gateway (for private subnet internet access)
aws ec2 create-nat-gateway \
  --subnet-id <public-subnet-1-id> \
  --allocation-id <elastic-ip-allocation-id>
```

## Step 4: Create RDS PostgreSQL Database

### Create DB Subnet Group
```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name attendance-db-subnet-group \
  --db-subnet-group-description "Subnet group for attendance DB" \
  --subnet-ids <private-subnet-1-id> <private-subnet-2-id>
```

### Create Security Group
```bash
aws ec2 create-security-group \
  --group-name attendance-db-sg \
  --description "Security group for RDS PostgreSQL" \
  --vpc-id <vpc-id>

# Allow PostgreSQL access from ECS tasks
aws ec2 authorize-security-group-ingress \
  --group-id <db-sg-id> \
  --protocol tcp \
  --port 5432 \
  --source-group <ecs-sg-id>
```

### Create RDS Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier attendance-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password <strong-password> \
  --allocated-storage 20 \
  --vpc-security-group-ids <db-sg-id> \
  --db-subnet-group-name attendance-db-subnet-group \
  --backup-retention-period 7 \
  --no-publicly-accessible
```

## Step 5: Create ElastiCache Redis

### Create Cache Subnet Group
```bash
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name attendance-redis-subnet-group \
  --cache-subnet-group-description "Subnet group for Redis" \
  --subnet-ids <private-subnet-1-id> <private-subnet-2-id>
```

### Create Security Group
```bash
aws ec2 create-security-group \
  --group-name attendance-redis-sg \
  --description "Security group for Redis" \
  --vpc-id <vpc-id>

# Allow Redis access from ECS tasks
aws ec2 authorize-security-group-ingress \
  --group-id <redis-sg-id> \
  --protocol tcp \
  --port 6379 \
  --source-group <ecs-sg-id>
```

### Create Redis Cluster
```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id attendance-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name attendance-redis-subnet-group \
  --security-group-ids <redis-sg-id>
```

## Step 6: Store Secrets in AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name attendance-service-secrets \
  --description "Secrets for Employee Attendance Service" \
  --secret-string '{
    "JWT_SECRET":"your-super-secret-key-min-32-characters-long",
    "DATABASE_URL":"postgresql://postgres:<password>@<rds-endpoint>:5432/attendance_db",
    "REDIS_URL":"redis://<elasticache-endpoint>:6379"
  }'
```

## Step 7: Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name attendance-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1
```

## Step 8: Create ECS Task Definition

Create file `task-definition.json`:

```json
{
  "family": "attendance-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "attendance-container",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/employee-attendance-service:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "JWT_EXPIRES_IN",
          "value": "24h"
        }
      ],
      "secrets": [
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:attendance-service-secrets:JWT_SECRET::"
        },
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:attendance-service-secrets:DATABASE_URL::"
        },
        {
          "name": "REDIS_URL",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:attendance-service-secrets:REDIS_URL::"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/attendance-service",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

Register task definition:
```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json
```

## Step 9: Create Application Load Balancer

### Create Security Group for ALB
```bash
aws ec2 create-security-group \
  --group-name attendance-alb-sg \
  --description "Security group for ALB" \
  --vpc-id <vpc-id>

# Allow HTTP/HTTPS from internet
aws ec2 authorize-security-group-ingress \
  --group-id <alb-sg-id> \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id <alb-sg-id> \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0
```

### Create ALB
```bash
aws elbv2 create-load-balancer \
  --name attendance-alb \
  --subnets <public-subnet-1-id> <public-subnet-2-id> \
  --security-groups <alb-sg-id> \
  --scheme internet-facing \
  --type application
```

### Create Target Group
```bash
aws elbv2 create-target-group \
  --name attendance-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id <vpc-id> \
  --target-type ip \
  --health-check-path /
```

### Create Listener
```bash
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

## Step 10: Create ECS Service

```bash
aws ecs create-service \
  --cluster attendance-cluster \
  --service-name attendance-service \
  --task-definition attendance-task \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[<private-subnet-1-id>,<private-subnet-2-id>],securityGroups=[<ecs-sg-id>],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=<target-group-arn>,containerName=attendance-container,containerPort=3000"
```

## Step 11: Run Database Migrations

You'll need to run Prisma migrations on the RDS database:

```bash
# SSH into an ECS task or use ECS Exec
aws ecs execute-command \
  --cluster attendance-cluster \
  --task <task-id> \
  --container attendance-container \
  --interactive \
  --command "/bin/sh"

# Inside the container:
npx prisma migrate deploy
```

Or run from local with port forwarding:
```bash
# Update DATABASE_URL to point to RDS
npm run prisma:deploy
```

## Step 12: Configure Auto Scaling (Optional)

### Create Auto Scaling Target
```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/attendance-cluster/attendance-service \
  --min-capacity 2 \
  --max-capacity 10
```

### Create Scaling Policy
```bash
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/attendance-cluster/attendance-service \
  --policy-name cpu-scaling-policy \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

`scaling-policy.json`:
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

## Step 13: Configure CloudWatch Logs

```bash
aws logs create-log-group \
  --log-group-name /ecs/attendance-service
```

## Step 14: Set Up HTTPS (Optional)

1. Request SSL certificate in AWS Certificate Manager
2. Create HTTPS listener:

```bash
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<certificate-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

## Deployment Updates

To deploy new versions:

```bash
# Build and push new image
docker build -t employee-attendance-service .
docker tag employee-attendance-service:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/employee-attendance-service:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/employee-attendance-service:latest

# Force new deployment
aws ecs update-service \
  --cluster attendance-cluster \
  --service attendance-service \
  --force-new-deployment
```

## Monitoring

- CloudWatch Logs: `/ecs/attendance-service`
- CloudWatch Metrics: ECS service metrics
- RDS Performance Insights: Database performance
- ElastiCache Metrics: Redis performance

## Cost Optimization Tips

1. Use FARGATE_SPOT for non-critical tasks
2. Enable RDS automated backups with appropriate retention
3. Use appropriate instance sizes (t3.micro for development)
4. Set up CloudWatch alarms for cost anomalies
5. Use Reserved Instances for long-term deployments

## Cleanup

To remove all resources:

```bash
# Delete ECS service
aws ecs delete-service --cluster attendance-cluster --service attendance-service --force

# Delete ECS cluster
aws ecs delete-cluster --cluster attendance-cluster

# Delete RDS instance
aws rds delete-db-instance --db-instance-identifier attendance-db --skip-final-snapshot

# Delete ElastiCache cluster
aws elasticache delete-cache-cluster --cache-cluster-id attendance-redis

# Delete ALB, target group, and listeners
aws elbv2 delete-load-balancer --load-balancer-arn <alb-arn>
aws elbv2 delete-target-group --target-group-arn <target-group-arn>

# Delete secrets
aws secretsmanager delete-secret --secret-id attendance-service-secrets

# Delete ECR repository
aws ecr delete-repository --repository-name employee-attendance-service --force
```

## Troubleshooting

### Task fails to start
- Check CloudWatch logs
- Verify security group rules
- Ensure secrets are accessible
- Check IAM roles and permissions

### Cannot connect to database
- Verify RDS endpoint
- Check security group rules
- Ensure task is in correct subnet
- Verify DATABASE_URL format

### Redis connection issues
- Verify ElastiCache endpoint
- Check security group rules
- Ensure REDIS_URL format is correct

## Security Best Practices

1. Use Secrets Manager for sensitive data
2. Enable VPC Flow Logs
3. Implement WAF rules on ALB
4. Enable GuardDuty
5. Regular security patches
6. Principle of least privilege for IAM roles
7. Enable encryption at rest for RDS and ElastiCache
8. Use private subnets for ECS tasks

## Support

For AWS-specific issues, consult AWS documentation or AWS Support.
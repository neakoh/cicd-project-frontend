terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0" 
    }
  }


  backend "remote" {
    organization = "neakoh-org"

    workspaces {
      name = "gitlab-cicd" 
    }
  }
}

provider "aws" {
  region = "eu-west-2"
}

# Variables for user-supplied values
variable "cluster_name" {
  description = "The name of the ECS cluster"
  type        = string
  default     = "gitlab-cicd-cluster"
}

variable "container_name" {
  description = "The name of the container"
  type        = string
  default     = "gitlab-cicd-container"
}

variable "image_uri" {
  description = "The URI of the Docker image to use"
  type        = string
  default     = ""
}

variable "container_sg_id" {
  description = "The security group ID to associate with the ECS service"
  type        = string
  default     = ""
}

variable "private_subnet_ids" {
  description = "A list of subnet IDs for the ECS service"
  type        = list(string)
  default     = [""] 
}

variable "alb_name" {
  description = "The name of the Application Load Balancer"
  type        = string
  default     = "gitlab-cicd-alb"
}

variable "alb_sg_id" {
  description = "ALB security group id"
  type        = string
  default     = ""
}

variable "alb_listener_port" {
  description = "The port for the ALB listener"
  type        = number
  default     = 80
}

variable "vpc_id" {
  description = "The port for the ALB listener"
  type        = string
  default     = ""
}

variable "health_check_path" {
  description = "The path for the health check"
  type        = string
  default     = "/"
}

resource "aws_ecs_cluster" "example" {
  name = var.cluster_name
}

// ECS Cluster Permissions: Task Execution + ECR Read
resource "aws_iam_role" "ecs_execution_role" {
  name               = "ecs_execution_role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "ecs_execution_role_policy_attachment" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  role       = aws_iam_role.ecs_execution_role.name
}
resource "aws_iam_role_policy_attachment" "ecs_ecr_policy_attachment" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.ecs_execution_role.name
}

# ECS Task Definition
resource "aws_ecs_task_definition" "example" {
  family                   = "${var.cluster_name}-task"
  execution_role_arn      = aws_iam_role.ecs_execution_role.arn
  requires_compatibilities = ["FARGATE"]
  network_mode            = "awsvpc"
  cpu                     = "256" 
  memory                  = "512" 

  container_definitions = jsonencode([
    {
      name      = var.container_name
      image     = var.image_uri
      essential = true
      portMappings = [
        {
          containerPort = 80 
          hostPort      = 80
          protocol      = "tcp"
        }
      ]
    }
  ])
}

// ECS Service
resource "aws_ecs_service" "example" {
  name            = "${var.cluster_name}-service"
  cluster         = aws_ecs_cluster.example.id
  task_definition = aws_ecs_task_definition.example.arn
  desired_count   = 2
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.container_sg_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.example.arn
    container_name   = var.container_name
    container_port   = 80 
  }
}
// Application Load Balancer
resource "aws_lb" "example" {
  name               = var.alb_name
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_sg_id] 
  subnets            = var.private_subnet_ids               

  enable_deletion_protection = false

  tags = {
    Name = var.alb_name
  }
}

// ALB target group
resource "aws_lb_target_group" "example" {
  name     = "${var.cluster_name}-tg"
  port     = 80 
  protocol = "HTTP"
  vpc_id   = var.vpc_id
  target_type = "ip"

  health_check {
    path                = var.health_check_path
    interval            = 30
    timeout             = 5
    healthy_threshold  = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.cluster_name}-tg"
  }
}


// ALB listener
resource "aws_lb_listener" "example" {
  load_balancer_arn = aws_lb.example.arn
  port              = var.alb_listener_port
  protocol          = "HTTP"

  default_action {
    type = "forward"
    target_group_arn = aws_lb_target_group.example.arn
  }
}
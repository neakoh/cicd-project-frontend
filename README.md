# Front-End Infrastructure and CI/CD Pipeline (Repo 2)

## Overview
This repository defines the AWS front-end infrastructure, CI/CD pipeline, application code, and the associated Sentinel policies for each component. It builds upon the infrastructure defined in **Repo 1**.

### Project Focus
The primary focus of this project was not on the application code or the Lambda function. As such, there are several improvements that could be made, such as implementing HTTPS into the Application Load Balancer (ALB). Currently, inbound traffic to the ALB is over HTTP. Practical use of TLS certificates is demonstrated in a static site CloudFront distribution in a different project.

## CI/CD Pipeline
The goal of this project was to build a fully automated CI/CD pipeline for the front-end infrastructure. The pipeline consists of four stages, each serving a specific purpose:

### Pipeline Stages

1. **Test**
   - **Purpose**: Run several security scans to ensure code quality and security.
   - **Actions**:
     - **Secret Scanning**: Checks for any credentials in plain text.
     - **SAST (Static Application Security Testing)**: Scans the application code for common vulnerabilities, logic flaws, and poorly written code.

2. **Build**
   - **Purpose**: Build the application image and push it to Amazon ECR (Elastic Container Registry).
   - **Actions**:
     - **Image Build**: The application image is built using the Dockerfile within the repository.
     - **Vulnerability Scanning**: The image is scanned using Trivy to check for high and critical severity vulnerabilities.
     - **Push to ECR**: Upon passing the scans, AWS ECR credentials are retrieved, and the image is pushed to ECR. The image URI is saved as an environment variable.

3. **Fetch Variables**
   - **Purpose**: Retrieve relevant outputs from **Repo 1**.
   - **Actions**:
     - Fetch subnet, VPC, and security group IDs from the Terraform Cloud workspace in **Repo 1**.
     - Save these values as environment variables for use in the next stage.

4. **Update Terraform**
   - **Purpose**: Update the Terraform variables file with the gathered environment variables.
   - **Actions**:
     - Clone the repository to check for the existence of a `.tfvars` file.
     - If the file exists, update it with the environment variables; if not, create a new `.tfvars` file.
     - Commit and push the updated or created `.tfvars` file, specifically tagging it to trigger a run in the second Terraform Cloud workspace.

### Deployment
If the pipeline completes successfully, the second Terraform Cloud workspace is triggered, initiating the typical plan, scan, and apply run to deploy the application.

## Repo Components

### Dockerfile
- **Base Image**: PHP (Alpine variant)
  - Chosen for its common use in web applications, particularly those requiring API functionality.
  - The Alpine variant is used to reduce the size of the image, helping to cut down build times.

### Application Code
- **Description**: A basic blog application with the following features:
  - Amazon Cognito authorization.
  - Simple HTTP methods: GET, POST, DELETE.

### Terraform File
- **Description**: This file defines the ECS task definition, service, and the ALB.

### Sentinel Policies
- **Description**: Policies that check which launch type the ECS task definition is using.

### Terraform Variables File
- **Description**: Updated from the pipeline with outputs from Terraform Cloud workspace 1.

### Pipeline Configuration
- **File Format**: The pipeline is defined in a `.yml` file format, which outlines the stages and actions taken during the CI/CD process.

## Conclusion
This repository provides a comprehensive setup for managing AWS front-end infrastructure and automating the deployment process through a CI/CD pipeline. By leveraging Terraform, Sentinel, and containerization, this project aims to enhance security, streamline deployment, and maintain best practices in infrastructure management.
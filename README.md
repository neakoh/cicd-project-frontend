# Frontend Infrastructure (Repo 2)
Repo 2 of 2. This defines the AWS front-end infrastructure, CI/CD pipeline, Application code and the associated Sentinel policies for each component.

The focus of this project was not the application code nor the Lambda function and as such there are several improvements that could be made.
I didn't implement HTTPS into my ALB as it wasn't in the scope of this project which is why inbound traffic to the ALB is over HTTP. I demonstrate practical use of tls certificates in a static site cloudfront distribution in a different project.

Following on from repo 1: I set out to build a fully automated CI/CD pipeline. For the front end infrastructure, I again defined it with Terraform, Scanned it with Sentinel and used Terraform cloud to manage state. As for building the application itself, I opted for containerization. The main benefit, amongst many others, of using containers is it allowed me to build the container image inside of a pipeline. The pipeline consists of four stages and is outlined below:

1. test
In this first stage I run several security scans: Secret scanning to check if there are any credentials in plain text and a SAST to scan my application code for common vulnerabilities, logic flaws, poorly written code etc.. 
2. build 
This stage builds an application image, scans it and then pushes it to ECR. The image is built using the Dockerfile within the repo, It is then scanned using trivy to check for high and critical severity vulnerabilities. Upon passing these scans AWS ECR credentials are retrieved, The image is pushed to ECR and the image URI is saved as an environment variable. 
3. fetch-variables
This stage gets the relevant outputs from repo 1 such as subnet, VPC and security group IDs and similarly to the build stage saves them as environment variables.
4. update terraform
In this final stage I clone into this repo to check whether a tfvars file exists. If it does I update it with the environment variables gathered from the prior 2 stages, if not, it is created. A commit and push is made to the repo with the updated/created tfvars file and is specifically tagged to trigger a run in the second Terraform cloud workspace.

If the pipeline completes, the second Terraform cloud workspace is triggered and the typical plan, scan, apply run is triggered and the application is deployed. 

## Repo components
### Docker file
I used PHP as the base image as it's commonly used in web applications and particularly those requiring API functionality. I used the alpine variant of this image to reduce the size of the image which helps to cut down build times.
### Application code
A basic blog application. Amazon Cognito authorization. Simple GET, POST, DELETE HTTP methods.
### Terraform file
This file defines the ECS task definition + service and the ALB.
### Sentinel policies
Checks which launch type the ECS task definition is using.
### Terraform variables file
Updated from the pipeline with outputs from Terraform Cloud workspace 1.
## Pipeline .yml file






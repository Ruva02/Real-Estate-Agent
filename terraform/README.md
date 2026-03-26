# Terraform Deployment Guide

This folder contains the Infrastructure as Code (IaC) configuration to automate deploying an AWS EC2 instance running K3s and Docker for the Haven AI application. 

It handles:
1. Provisioning a `c7i-flex.large` EC2 instance with an associated Security Group.
2. Opening network ports (`22` for SSH, `80` for Frontend web, `443` for HTTPS, and `5016` for the Backend API).
3. Automatically installing Docker and Kubernetes (K3s) on boot.

## Step-by-Step Instructions

### 1. Prerequisites
- **Terraform CLI**: [Install Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli).
- **AWS CLI**: [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and configure it by running `aws configure` in your terminal to set your AWS credentials.
- **AWS Key Pair**: Ensure you have an existing Key Pair in AWS for EC2 SSH access.

### 2. Initialization
Open your terminal in this `terraform/` directory and run:
```bash
terraform init
```

### 3. Execution Plan
To see what Terraform will create, run:
```bash
terraform plan
```
You will be prompted to enter the `key_name` (the name of your AWS SSH Key Pair).

### 4. Deploy Infrastructure
To deploy the infrastructure, run:
```bash
terraform apply
```
Type `yes` to confirm. 

### 5. Access the Server and Deploy App
After the process completes, you will see output similar to:
```text
instance_public_ip = "X.X.X.X"
ssh_command = "ssh -i <your-key-pair.pem> ubuntu@X.X.X.X"
```

Use the `ssh_command` to log into your server:
```bash
ssh -i /path/to/your/key.pem ubuntu@X.X.X.X
```

**Note:** Wait a few minutes after the instance boots for the `user_data.sh` script to finish installing Docker and K3s.
You can verify K3s is running with:
```bash
kubectl get nodes
docker ps
```

From there, you can clone your code onto the server or simply apply your Kubernetes `.yaml` manifests from the `/k8s` directory directly:
```bash
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

Once running, update your Frontend's environment variable (`NEXT_PUBLIC_API_BASE_URL`) to use `http://X.X.X.X:5016` where `X.X.X.X` is the new Public IP shown in Terraform!

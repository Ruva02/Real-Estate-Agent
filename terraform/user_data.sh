#!/bin/bash
# user_data.sh - script to automatically install Docker and K3s on Ubuntu

# Prevent interactive prompts
export DEBIAN_FRONTEND=noninteractive

# Update system
apt-get update -y
apt-get upgrade -y

# Install prerequisites
apt-get install -y apt-transport-https ca-certificates curl software-properties-common git

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io

# Setup Docker config to start on boot and allow ubuntu user access
systemctl start docker
systemctl enable docker
usermod -aG docker ubuntu

# Install lightweight Kubernetes (K3s)
# Note: K3s includes kubectl natively
# Update: Added --tls-san for external kubectl access via public IP
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--tls-san $(curl -s http://checkip.amazonaws.com)" sh -

# K3s setup for the default 'ubuntu' user so we can connect to cluster
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube

# Add kubeconfig path directly to shell
echo "export KUBECONFIG=/home/ubuntu/.kube/config" >> /home/ubuntu/.bashrc

echo "Haven AI K3s setup complete."

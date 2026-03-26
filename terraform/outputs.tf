output "instance_public_ip" {
  description = "The public IP address of the EC2 instance"
  value       = aws_instance.k3s_node.public_ip
}

output "ssh_command" {
  description = "The command to SSH into the EC2 instance"
  value       = "ssh -i <your-key-pair.pem> ubuntu@${aws_instance.k3s_node.public_ip}"
}

variable "aws_region" {
  description = "The AWS region to deploy to"
  type        = string
  default     = "ap-south-1"
}

variable "instance_type" {
  description = "The EC2 instance type"
  type        = string
  default     = "c7i-flex.large" # Updated per user
}

variable "key_name" {
  description = "Name of the existing AWS Key Pair to allow SSH access to the instance"
  type        = string
}

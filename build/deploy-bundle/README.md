# MVTA Free Tier Deployment (AWS EC2 + Docker Compose + Caddy)

## Steps

1. **Launch EC2**
   - Instance: t2.micro (Free Tier)
   - AMI: Amazon Linux 2023 or Ubuntu 22.04
   - Storage: 20 GB gp3
   - Security Group: open ports 22, 80, 443
   - Allocate Elastic IP and associate with EC2.

2. **Install Docker & Compose**
   ```bash
   sudo yum update -y
   sudo yum install docker -y
   sudo systemctl enable docker
   sudo systemctl start docker
   sudo usermod -aG docker ec2-user

   # Install Docker Compose plugin
   sudo curl -SL https://github.com/docker/compose/releases/download/v2.29.2/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

3. **Upload Files**
   ```bash
   scp -i your-key.pem -r . ec2-user@your-ec2-ip:/home/ec2-user/mvta
   ssh -i your-key.pem ec2-user@your-ec2-ip
   cd mvta
   ```

4. **Run Containers**
   ```bash
   docker-compose --env-file .env.production up -d --build
   docker-compose logs -f
   ```

5. **DNS**
   - Point mvta.io and www.mvta.io to your Elastic IP.

6. **Result**
   - App runs at https://mvta.io with free TLS from Caddy.

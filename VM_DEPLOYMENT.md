# Deploy StudyFlow to an Azure VM

This project runs on an Ubuntu VM with Docker Compose. Nginx serves the Vite frontend on port 80 and forwards `/api` requests to the Next.js backend container. The backend port is not exposed publicly. Deployment is done from your Mac over SSH; GitHub Actions and App Service are not required.

## 1. Prepare your existing Azure VM

Your `study-flow` VM is running Ubuntu 24.04 and is now Standard B2als v2 with 4 GiB RAM, which is suitable for these Docker builds. Its DNS name is `study-flow.eastasia.cloudapp.azure.com`; use that host name in the commands below.

In the VM's Network Security Group, allow inbound TCP port 80 from the Internet. Keep SSH (TCP 22) limited to your current public IP. Do not open port 3000; only Nginx needs to be reachable. See [Microsoft's Linux VM connection guide](https://learn.microsoft.com/azure/virtual-machines/linux-vm-connect).

## 2. Connect from your Mac

In Mac Terminal, set these values to match your VM and downloaded SSH key:

```bash
export STUDYFLOW_VM_USER="azureuser"
export STUDYFLOW_VM_HOST="study-flow.eastasia.cloudapp.azure.com"
export STUDYFLOW_VM_KEY="$HOME/Downloads/studyflow-vm.pem"
chmod 400 "$STUDYFLOW_VM_KEY"
ssh -i "$STUDYFLOW_VM_KEY" "$STUDYFLOW_VM_USER@$STUDYFLOW_VM_HOST"
```

Replace the example username, IP, and key filename. The first SSH connection asks you to verify the VM host key.

## 3. Install Docker on the VM

Run the [official Docker Engine installation steps for Ubuntu](https://docs.docker.com/engine/install/ubuntu/) in the VM's SSH session. Then enable Docker and give the VM user permission to run Compose:

```bash
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
exit
```

Reconnect from your Mac using the SSH command above. Confirm Docker Compose is available:

```bash
docker compose version
```

## 4. Put the backend environment file on the VM

Back in Mac Terminal, from any directory, create the target folder and copy the local environment file over SSH:

```bash
ssh -i "$STUDYFLOW_VM_KEY" "$STUDYFLOW_VM_USER@$STUDYFLOW_VM_HOST" 'mkdir -p ~/Study_Flow/backend'
scp -i "$STUDYFLOW_VM_KEY" \
  "/Users/thweyamin/Desktop/3rd year 1st sem/web application/Study_Flow/backend/.env.local" \
  "$STUDYFLOW_VM_USER@$STUDYFLOW_VM_HOST:Study_Flow/backend/.env.local"
```

The file must contain `MONGODB_URI`, `DB_NAME`, and `JWT_SECRET`. It is excluded from source transfers and Docker build contexts. If you change these values later, copy the file again and restart the containers.

If you use MongoDB Atlas, add the VM's outbound public IP to the Atlas network access list.

## 5. Transfer the source and start the app

In Mac Terminal, move to the project root:

```bash
cd "/Users/thweyamin/Desktop/3rd year 1st sem/web application/Study_Flow"
```

Copy the project to the VM. This command excludes Git metadata, local dependencies/build output, and environment files, so the VM's `.env.local` remains in place:

```bash
rsync -az \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='dist/' \
  --exclude='.env*' \
  -e "ssh -i $STUDYFLOW_VM_KEY" \
  ./ "$STUDYFLOW_VM_USER@$STUDYFLOW_VM_HOST:Study_Flow/"
```

Build sequentially to reduce memory pressure, then start the containers:

```bash
ssh -i "$STUDYFLOW_VM_KEY" "$STUDYFLOW_VM_USER@$STUDYFLOW_VM_HOST" \
  'cd ~/Study_Flow && COMPOSE_PARALLEL_LIMIT=1 docker compose up -d --build'
```

## 6. Check the deployment

On the VM, check container status and logs:

```bash
ssh -i "$STUDYFLOW_VM_KEY" "$STUDYFLOW_VM_USER@$STUDYFLOW_VM_HOST" \
  'cd ~/Study_Flow && docker compose ps && docker compose logs --tail=100'
```

Open `http://study-flow.eastasia.cloudapp.azure.com` in a browser. The frontend and `/api` share the same origin, so the frontend uses the default empty `VITE_API_URL` and no separate CORS origin is needed.

## 7. Deploy updates later

From the project root on your Mac, repeat the `rsync` command and then the remote `docker compose up -d --build` command. You do not need to copy `.env.local` again unless its values changed.

This setup gives you an HTTP link. For HTTPS, connect a domain to the VM and configure a TLS certificate before using real account passwords.

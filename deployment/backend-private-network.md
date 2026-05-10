# Backend Private Network Checklist

Bu proje proxy-first mimari kullanir. Production ortaminda Laravel backend public internete acilmamalidir.

## Zorunlu kontroller

- Frontend ve backend ortamlarinda ayni `BACKEND_PROXY_SECRET` tanimli olmalidir.
- `BACKEND_API_URL`, public domain yerine private backend adresini gostermelidir.
- Laravel backend firewall/VPC/security group ile yalnizca Next.js runtime veya reverse proxy IP'lerinden erisilebilir olmalidir.
- Backend public HTTP portu internete aciksa deploy kabul edilmemelidir.

## VPS / UFW ornegi

```bash
sudo ufw default deny incoming
sudo ufw allow ssh
sudo ufw allow from <NEXT_PROXY_PRIVATE_IP> to any port 8000 proto tcp
sudo ufw enable
```

## Nginx internal network ornegi

```nginx
server {
    listen 10.0.0.10:8000;
    server_name backend.internal;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Bu dosya uygulama kodundaki `proxy.only` middleware'in yerine gecmez; network seviyesindeki asil izolasyonu tarif eder.

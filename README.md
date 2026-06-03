# Deploy AWS EC2 — Backend + Frontend + Supabase

Guia completo do projeto **CRUD de Produtos** com:

- **Banco:** Supabase (nuvem)
- **VM 1:** Backend — Node.js + Express (API REST)
- **VM 2:** Frontend — HTML/CSS/JS + Nginx

Repositórios:

| Parte | GitHub |
|-------|--------|
| Backend | https://github.com/felps-developer/Projeto-Aws |
| Frontend | https://github.com/felps-developer/supabasefront |

---

## Arquitetura

```
[Navegador] → http://IP_FRONTEND:5000  (VM Frontend - Nginx)
                    ↓ fetch
              http://IP_BACKEND:3000     (VM Backend - Node/PM2)
                    ↓
              Supabase (PostgreSQL)
```

| Porta | VM | Serviço |
|-------|-----|---------|
| **3000** | Backend | API REST |
| **5000** | Frontend | Site estático |
| — | Supabase | Banco de dados |

---

## Pré-requisitos

- Conta AWS com 2 instâncias **EC2** (Amazon Linux 2023)
- Par de chaves `.pem` para SSH
- Projeto no **Supabase** com tabela `products` (colunas: `id`, `name`, `description`, `price`)
- RLS desligado **ou** policies liberadas (ver [Supabase](#supabase-rls))

---

## Security Groups (regras de entrada)

### VM Backend

| Tipo | Porta | Origem |
|------|-------|--------|
| SSH | 22 | Seu IP |
| Custom TCP | **3000** | 0.0.0.0/0 |

### VM Frontend

| Tipo | Porta | Origem |
|------|-------|--------|
| SSH | 22 | Seu IP |
| Custom TCP | **5000** | 0.0.0.0/0 |

> Para o trabalho acadêmico usa-se `0.0.0.0/0`. Em produção, restrinja ao IP necessário.

---

# PARTE 1 — Backend (VM 1)

## 1.1 Criar instância EC2

1. AWS Console → **EC2** → **Launch instance**
2. Nome: `backend-produtos`
3. AMI: **Amazon Linux 2023**
4. Tipo: **t2.micro**
5. Key pair: sua chave `.pem`
6. Security Group: regras da tabela **VM Backend** acima
7. **Launch**
8. Anote o **IPv4 público** → `IP_BACKEND`

## 1.2 Conectar por SSH

No PowerShell (Windows):

```powershell
ssh -i "C:\caminho\sua-chave.pem" ec2-user@IP_BACKEND
```

## 1.3 Instalar Node.js (nvm)

```bash
sudo su
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
. ~/.nvm/nvm.sh
nvm install --lts
node -v
npm -v
```

## 1.4 Instalar Git e clonar o backend

```bash
sudo yum install git -y
cd /home/ec2-user
git clone https://github.com/felps-developer/Projeto-Aws.git
cd Projeto-Aws
```

## 1.5 Criar arquivo `.env`

Na pasta `Projeto-Aws` (mesmo nível que `app.js`):

```bash
nano .env
```

Conteúdo (use seus dados do Supabase → **Settings → API**):

```env
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_KEY=sua_chave_anon_ou_publishable
PORT=3000
```

Salvar: `Ctrl+O`, Enter, `Ctrl+X`.

> O `.env` **não** vai para o Git. Crie manualmente em cada VM.

## 1.6 Instalar dependências

```bash
cd /home/ec2-user/Projeto-Aws
. ~/.nvm/nvm.sh
npm install
```

## 1.7 Testar manualmente (opcional)

```bash
npm start
```

Deve aparecer: `API rodando em http://localhost:3000`

Teste na VM: `curl http://localhost:3000/products`

Pare com **Ctrl+C** e use o PM2 no passo seguinte.

## 1.8 Manter API sempre rodando (PM2)

```bash
. ~/.nvm/nvm.sh
npm install -g pm2
pm2 start app.js --name app
pm2 save
pm2 startup
```

Execute o comando que o `pm2 startup` mostrar (linha com `sudo env PATH=...`).

Conferir:

```bash
pm2 status
pm2 logs app
```

## 1.9 Testar de fora da VM

No navegador do seu PC:

```text
http://IP_BACKEND:3000/
http://IP_BACKEND:3000/products
```

Deve retornar JSON com os produtos (ou `[]` se vazio).

---

# PARTE 2 — Frontend (VM 2)

Na VM frontend você usa **somente Git + Nginx** na porta **5000**.

**Não use na EC2:** `npm run dev`, `npx serve`, `node app.js` — isso é só para desenvolvimento no seu PC.

Arquivos necessários no repositório: `index.html`, `app.js`, `style.css`, `config.js`.

---

## 2.1 Criar instância e Security Group

1. **EC2 → Launch instance** → nome: `frontend-produtos`
2. AMI: **Amazon Linux 2023**, tipo **t2.micro**, mesma chave `.pem`
3. Security Group — regra de entrada:

| Tipo | Porta | Origem |
|------|-------|--------|
| SSH | 22 | Seu IP |
| Custom TCP | **5000** | 0.0.0.0/0 |

4. **Launch** e anote o **IPv4 público** → `IP_FRONTEND`

---

## 2.2 Ajustar `config.js` no GitHub (no seu PC)

O front precisa chamar o **backend**, não `localhost`:

```javascript
const API_URL = 'http://IP_BACKEND:3000';
```

Substitua `IP_BACKEND` pelo IP público da VM do backend (ex.: `100.55.150.29`).

```powershell
cd caminho\supabasefront
git add config.js
git commit -m "Aponta API para IP do backend na AWS"
git push origin main
```

(Se a branch for `master`, use `git push origin master`.)

---

## 2.3 Conectar na VM frontend (SSH)

```powershell
ssh -i "C:\caminho\sua-chave.pem" ec2-user@IP_FRONTEND
```

---

## 2.4 Instalar Git e Nginx

```bash
sudo yum update -y
sudo yum install git nginx policycoreutils-python-utils -y
```

Liberar porta **5000** no SELinux (Amazon Linux):

```bash
sudo semanage port -a -t http_port_t -p tcp 5000 2>/dev/null || true
```

---

## 2.5 Clonar o repositório com Git

```bash
cd /home/ec2-user
git clone https://github.com/felps-developer/supabasefront.git
cd supabasefront
ls
```

Deve listar: `index.html` `app.js` `style.css` `config.js`

Confira o IP do backend:

```bash
cat config.js
```

Tem que aparecer `http://IP_BACKEND:3000`. Se estiver errado:

```bash
nano config.js
# corrija, salve (Ctrl+O, Enter, Ctrl+X)
# depois: git add config.js && git commit -m "fix api url" && git push
```

---

## 2.6 Copiar arquivos para o Nginx

```bash
sudo mkdir -p /var/www/produtos
sudo cp -r /home/ec2-user/supabasefront/* /var/www/produtos/
sudo chown -R nginx:nginx /var/www/produtos
sudo chmod -R 755 /var/www/produtos
```

---

## 2.7 Configurar Nginx na porta 5000

```bash
sudo nano /etc/nginx/conf.d/produtos.conf
```

Cole **apenas** isto:

```nginx
server {
    listen 5000;
    server_name _;
    root /var/www/produtos;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Salvar e ativar:

```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

Conferir se a porta 5000 está ouvindo:

```bash
sudo ss -tlnp | grep 5000
```

---

## 2.8 Testar no navegador (seu PC)

```text
http://IP_FRONTEND:5000
```

**Importante:** use `:5000` na URL.

| Teste | Esperado |
|-------|----------|
| Página abre | Lista, busca e botão **Criar produto** |
| Listar produtos | Chama `http://IP_BACKEND:3000/products` |
| Criar / editar / excluir | Funciona se o backend estiver no ar |

Teste direto da API (outra aba):

```text
http://IP_BACKEND:3000/products
```

---

## 2.9 Atualizar o site depois (só Git + Nginx)

Quando mudar código no GitHub:

```bash
cd /home/ec2-user/supabasefront
git pull
sudo cp -r /home/ec2-user/supabasefront/* /var/www/produtos/
sudo systemctl reload nginx
```

---

## 2.10 O que NÃO fazer na VM frontend

| Não usar na EC2 | Motivo |
|-----------------|--------|
| `npm install` / `npm run dev` | Não precisa de Node no front |
| `node app.js` | `app.js` é código do **navegador** |
| `npx serve` | Nginx já serve os arquivos |
| Porta 80 (se o SG só abre 5000) | Site fica em **5000** |

---

# PARTE 3 — Rodar local (desenvolvimento)

## Backend

```powershell
cd Projeto-Aws
# Crie .env com SUPABASE_URL, SUPABASE_KEY, PORT=3000
npm install
npm start
```

## Frontend

```powershell
cd supabasefront
# config.js → http://localhost:3000
npm run dev
```

Abra: http://localhost:5500

---

# PARTE 4 — Parar e religar as instâncias (à noite)

## Só fechou o SSH (instância continua **Running**)

Nada extra. Use as mesmas URLs:

- `http://IP_BACKEND:3000/products`
- `http://IP_FRONTEND:5000`

## Deu **Stop** na EC2 e depois **Start**

O **IP público pode mudar** (use **Elastic IP** para evitar isso).

### Passo a passo ao religar

1. Console AWS → **Start instance** nas duas VMs
2. Anote os **novos** IPv4 públicos
3. **Backend** — SSH:

```bash
cd /home/ec2-user/Projeto-Aws
. ~/.nvm/nvm.sh
pm2 status
```

| Se `app` estiver **online** | Nada |
| Se estiver parado | `pm2 start app.js --name app` e `pm2 save` |

4. Teste: `http://NOVO_IP_BACKEND:3000/products`

5. **Frontend** — SSH na VM frontend:

```bash
cd /home/ec2-user/supabasefront
git pull
# Se o IP do backend mudou, edite config.js no PC, dê push, e git pull de novo
sudo cp -r /home/ec2-user/supabasefront/* /var/www/produtos/
sudo systemctl start nginx
sudo systemctl status nginx
```

6. Teste: `http://NOVO_IP_FRONTEND:5000`

---

# PARTE 5 — Elastic IP (recomendado)

Evita trocar IP ao parar/ligar a instância:

1. EC2 → **Elastic IPs** → **Allocate**
2. **Associate** à instância (backend e frontend)
3. Use o Elastic IP no `config.js` e na documentação do trabalho

---

# Supabase (RLS)

Se a API retorna `[]` mas o Table Editor mostra produtos, libere o RLS.

**Opção rápida (SQL Editor):**

```sql
alter table products disable row level security;
```

**Opção com policies** — use o arquivo `supabase-rls.sql` neste repositório.

---

# API — Rotas do backend

| Método | Rota | Ação |
|--------|------|------|
| GET | `/products` | Listar todos |
| GET | `/products/:id` | Buscar por ID |
| POST | `/products` | Criar |
| PUT | `/products/:id` | Atualizar |
| DELETE | `/products/:id` | Excluir |

---

# Comandos úteis

## Backend

```bash
pm2 status
pm2 logs app
pm2 restart app
pm2 stop app
```

## Frontend

```bash
sudo systemctl status nginx
sudo systemctl restart nginx
sudo tail -f /var/log/nginx/error.log
```

## Liberar porta ocupada (se precisar)

```bash
sudo ss -tlnp | grep 3000
```

---

# Checklist final (entrega)

- [ ] 2 VMs EC2 separadas (backend + frontend)
- [ ] Supabase com tabela `products` e campo `description`
- [ ] `http://IP_BACKEND:3000/products` retorna JSON
- [ ] `http://IP_FRONTEND:5000` abre a interface
- [ ] CRUD completo funcionando pelo navegador
- [ ] `config.js` aponta para o IP do backend (não `localhost` na nuvem)

---

# Problemas comuns

| Problema | Solução |
|----------|---------|
| `Cannot GET /products` na porta 3000 | Outro app na porta ou URL errada — use o IP do backend com `:3000` |
| API retorna `[]` com dados no Supabase | RLS — ver seção Supabase |
| Front não carrega produtos | `config.js` com IP errado ou backend parado |
| Porta em uso no backend | `pm2 status` ou mude `PORT` no `.env` |
| Site não abre na 5000 | Security Group + `nginx` + `ss -tlnp \| grep 5000` |
| Após Stop/Start não funciona | IPs mudaram — atualize `config.js` e teste PM2/Nginx |

---

# URLs de exemplo (substitua pelos seus IPs)

| Serviço | URL |
|---------|-----|
| API | `http://IP_BACKEND:3000` |
| Site | `http://IP_FRONTEND:5000` |

Exemplo usado em desenvolvimento: backend `100.55.150.29` — **sempre use o IP atual da sua instância**.

● Subir uma aplicação Node.js para a Amazon EC2
● Criar uma instância gratuita do EC2 (usar o IAM criado)
● Conectar na instância
● Liberar a porta da aplicação Node.js (ex: 3000)
● Instalar o Git e o Node na instância
● Clonar a aplicação a partir do Github
● Configurar a aplicação e subir a mesma na instância
● Testar a aplicação usando IP público ou DNS (porta também) pelo Browser


comandos 
sudo su
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
. ~/.nvm/nvm.sh
nvm install --lts
sudo yum install git -y
git clone url-publicada
sudo su
npm init
sudo su
npm install express --save
node index.js

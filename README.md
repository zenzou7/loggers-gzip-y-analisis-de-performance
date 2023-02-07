#COMANDOS
pm2 start server.js --name="server1" --watch -- --port 8081
pm2 start server.js --name="server2" --watch -i max -- --port 8082 sudo nginx

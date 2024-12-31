#!/bin/bash
cd /home/u730069342/domains/ai-legal-assistant.sbouldin.com/nodeapp
npm install -g pm2
pm2 delete server || true
pm2 start server.js --name server
pm2 save

#!/bin/bash
# Raspberry Pi 초기 설정 스크립트
# Pi에 SSH 접속 후 한 번만 실행하면 됨
# ssh pi@192.168.45.126

set -e

echo "=== 1. PM2 설치 ==="
npm install -g pm2

echo "=== 2. 앱 클론 ==="
if [ -d ~/planner ]; then
  echo "이미 존재함. git pull만 실행..."
  cd ~/planner && git pull origin main
else
  git clone https://github.com/jung0228/planner.git ~/planner
  cd ~/planner
fi

echo "=== 3. 의존성 설치 & 빌드 ==="
cd ~/planner
npm install
npm run build

echo "=== 4. PM2로 시작 ==="
pm2 start npm --name planner -- start
pm2 save
pm2 startup  # 재부팅 시 자동 시작 설정 (출력된 명령어를 그대로 실행)

echo ""
echo "=== 5. GitHub Actions Self-hosted Runner 설치 ==="
echo "GitHub 저장소 → Settings → Actions → Runners → New self-hosted runner"
echo "Linux (ARM) 선택 후 나오는 명령어를 그대로 실행하세요."
echo ""
echo "완료! http://localhost:3000 에서 확인"

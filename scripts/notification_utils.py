import requests
import json
import os
from datetime import datetime

# 윈도우 데스크톱 알림 (Windows Notification)
def send_windows_toast(title, message):
    try:
        from win10toast import ToastNotifier
        toaster = ToastNotifier()
        toaster.show_toast(title, message, duration=5, threaded=True)
    except Exception:
        # Fallback using PowerShell Toast if win10toast not installed
        try:
            ps_script = f'''
            [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
            [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocumentData, ContentType = WindowsRuntime] | Out-Null
            $xml = [Windows.Data.Xml.Dom.XmlDocument]::new()
            $xml.LoadXml("<toast><visual><binding template='ToastGeneric'><text>{title}</text><text>{message}</text></binding></visual></toast>")
            $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
            [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("노무체크AI").Show($toast)
            '''
            os.system(f'powershell -Command "{ps_script}"')
        except Exception:
            pass

# 텔레그램 봇 알림 (Telegram Bot)
def send_telegram_alert(bot_token, chat_id, title, post_url, category="노무/산재"):
    if not bot_token or not chat_id:
        return False
    try:
        msg = f"🎉 [노무체크AI 블로그 신규 포스팅 발행 완료]\n\n📌 **제목**: {title}\n📂 **카테고리**: {category}\n⏰ **발행시각**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n🔗 **게시글 바로가기**:\n{post_url}"
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {"chat_id": chat_id, "text": msg, "parse_mode": "Markdown"}
        r = requests.post(url, json=payload, timeout=5)
        return r.status_code == 200
    except Exception as e:
        print(f"Telegram alert error: {e}")
        return False

# 디스코드 웹훅 알림 (Discord Webhook)
def send_discord_alert(webhook_url, title, post_url, category="노무/산재"):
    if not webhook_url:
        return False
    try:
        payload = {
            "username": "노무체크AI 포스팅 알리미",
            "embeds": [
                {
                    "title": f"📢 신규 노무 블로그 포스팅이 발행되었습니다!",
                    "description": f"**제목**: {title}\n**카테고리**: {category}\n**URL**: [게시글 보기]({post_url})",
                    "color": 1718858,
                    "footer": {"text": f"발행시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"}
                }
            ]
        }
        r = requests.post(webhook_url, json=payload, timeout=5)
        return r.status_code == 204 or r.status_code == 200
    except Exception as e:
        print(f"Discord alert error: {e}")
        return False

# 카카오톡 '나에게 보내기' 알림 (KakaoTalk API)
def send_kakaotalk_alert(access_token, title, post_url, category="노무/산재"):
    if not access_token:
        return False
    try:
        url = "https://kapi.kakao.com/v2/api/talk/memo/default/send"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        template_object = {
            "object_type": "text",
            "text": f"📢 [노무체크AI 신규 블로그 포스팅]\n\n📌 제목: {title}\n📂 카테고리: {category}\n⏰ 발행시각: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            "link": {
                "web_url": post_url,
                "mobile_web_url": post_url
            },
            "button_title": "👉 블로그 글 보러가기"
        }
        data = {"template_object": json.dumps(template_object)}
        r = requests.post(url, headers=headers, data=data, timeout=5)
        return r.status_code == 200
    except Exception as e:
        print(f"KakaoTalk alert error: {e}")
        return False

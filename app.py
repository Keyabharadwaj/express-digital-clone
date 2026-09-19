from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_mail import Mail, Message
import sqlite3
import os
import webbrowser

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "express-digital-secret-key")

DATABASE = "database/site.db"

# -----------------------------
# Flask-Mail Configuration
# -----------------------------
# Replace default fallback settings or pass them via environment variables
app.config["MAIL_SERVER"] = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
app.config["MAIL_PORT"] = int(os.environ.get("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.environ.get("MAIL_USE_TLS", "true").lower() in ["true", "on", "1"]
app.config["MAIL_USERNAME"] = os.environ.get("MAIL_USERNAME", "your-email@gmail.com")
app.config["MAIL_PASSWORD"] = os.environ.get("MAIL_PASSWORD", "your-app-password")
app.config["MAIL_DEFAULT_SENDER"] = os.environ.get("MAIL_DEFAULT_SENDER", app.config["MAIL_USERNAME"])

# The internal email address where lead notification alerts are sent
ADMIN_NOTIFICATION_EMAIL = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "care@express.digital")

mail = Mail(app)


# -----------------------------
# Database Setup & Helper
# -----------------------------
def init_db():
    os.makedirs("database", exist_ok=True)
    conn = sqlite3.connect(DATABASE)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            company TEXT,
            service TEXT,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


init_db()


# -----------------------------
# Helper: Send Email Notification
# -----------------------------
def send_lead_notification(name, email, company, service, message):
    """Sends an email alert to the admin team when a new contact inquiry arrives."""
    try:
        msg = Message(
            subject=f"[Express.Digital Lead] New inquiry from {name}",
            recipients=[ADMIN_NOTIFICATION_EMAIL],
            reply_to=email
        )
        msg.body = f"""
New Lead Submission Details:

Name: {name}
Email: {email}
Company: {company if company else 'N/A'}
Service Requested: {service if service else 'N/A'}

Message:
{message}
        """
        mail.send(msg)
    except Exception as e:
        # Log email dispatch failure without crashing the user flow
        app.logger.error(f"Failed to send lead email notification: {e}")


# -----------------------------
# Core Routes
# -----------------------------
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/about")
def about():
    return render_template("about.html")


@app.route("/services")
def services():
    return render_template("services.html")


@app.route("/work")
def work():
    return render_template("work.html")


# -----------------------------
# Contact & Lead Submission
# -----------------------------
@app.route("/contact", methods=["GET", "POST"])
def contact():
    if request.method == "POST":
        # Supports both AJAX (JSON) and traditional HTML form submissions
        if request.is_json:
            data = request.get_json()
            name = data.get("name")
            email = data.get("email")
            company = data.get("company", "")
            service = data.get("service", "")
            message = data.get("message")
        else:
            name = request.form.get("name")
            email = request.form.get("email")
            company = request.form.get("company", "")
            service = request.form.get("service", "")
            message = request.form.get("message")

        # Validation
        if not name or not email or not message:
            if request.is_json:
                return jsonify({"status": "error", "message": "Name, email, and message are required."}), 400
            flash("Please fill in all required fields.")
            return redirect(url_for("contact"))

        # 1. Save to Database
        conn = get_db_connection()
        conn.execute("""
            INSERT INTO contacts (name, email, company, service, message)
            VALUES (?, ?, ?, ?, ?)
        """, (name, email, company, service, message))
        conn.commit()
        conn.close()

        # 2. Trigger Email Notification
        send_lead_notification(name, email, company, service, message)

        # 3. Response routing
        if request.is_json:
            return jsonify({
                "status": "success",
                "message": "Thank you! Your message has been submitted successfully."
            }), 200

        flash("Thank you! Your message has been submitted successfully.")
        return redirect(url_for("contact"))

    return render_template("contact.html")


# -----------------------------
# Admin View
# -----------------------------
@app.route("/admin/leads")
def admin_leads():
    conn = get_db_connection()
    leads = conn.execute("SELECT * FROM contacts ORDER BY created_at DESC").fetchall()
    conn.close()
    return jsonify([dict(lead) for lead in leads])


if __name__ == "__main__":
    init_db()
    # Automatically launch your web browser
    webbrowser.open("http://127.0.0.1:8000")
    app.run(debug=True, host="127.0.0.1", port=8000)
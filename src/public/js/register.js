document.getElementById("registerForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value;
    const phoneNumber = document.getElementById("phoneNumber").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            fullName,
            phoneNumber,
            email,
            password,
            confirmPassword
        }),
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {
            document.getElementById("registerForm").style.display = "none";
            document.getElementById("otpSection").style.display = "block";
            document.getElementById("email").value = data.email || email;
            alert(data.message);
        } else {
            const fields = ["fullName", "phoneNumber", "email", "password", "confirmPassword"];
            fields.forEach((field) => {
                const errEl = document.getElementById(`error-${field}`);
                const inputEl = document.getElementById(field);
                if (errEl) {
                    errEl.textContent = data.errors?.[field] || "";
                }
                if (inputEl && data.userData?.[field]) {
                    inputEl.value = data.userData[field];
                }
            });
        }
    })

    .catch(err => {
        console.error(err);
        alert("Lỗi hệ thống.");
    });
});

document.getElementById("otpForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const otpValue = this.otp.value;
    const email = document.getElementById("email").value;

    fetch("/register/verify-otp", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, otp: otpValue }),
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {
            alert(data.message);
            window.location.href = "/login";
        } else {
            alert(data.message);
        }
    })
    .catch(err => {
        console.error(err);
        alert("Lỗi hệ thống.");
    });
});

document.getElementById("backToRegister").addEventListener("click", function() {
    document.getElementById("otpSection").style.display = "none";
    document.getElementById("registerForm").style.display = "block";
});

// Toggle password
document.getElementById("togglePassword").addEventListener("click", function () {
    const pw = document.getElementById("password");
    const type = pw.type === "password" ? "text" : "password";
    pw.type = type;
    this.querySelector("i").classList.toggle("fa-eye");
    this.querySelector("i").classList.toggle("fa-eye-slash");
});

document.getElementById("toggleConfirmPassword").addEventListener("click", function () {
    const pw = document.getElementById("confirmPassword");
    const type = pw.type === "password" ? "text" : "password";
    pw.type = type;
    this.querySelector("i").classList.toggle("fa-eye");
    this.querySelector("i").classList.toggle("fa-eye-slash");
});


let countdown = 30;
  const resendBtn = document.getElementById('resendOTPBtn');
  const countdownSpan = document.getElementById('countdown');
  const email = "{{email}}";

  const timer = setInterval(() => {
    countdown--;
    countdownSpan.textContent = countdown;
    if (countdown <= 0) {
      resendBtn.disabled = false;
      resendBtn.textContent = "Gửi lại mã OTP";
      clearInterval(timer);
    }
  }, 1000);

  resendBtn.addEventListener("click", async function (e) {
    e.preventDefault();
    resendBtn.disabled = true;
    resendBtn.textContent = "Đang gửi lại...";

    try {
      const response = await fetch("/register/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      if (data.success) {
        countdown = 30;
        resendBtn.textContent = "Gửi lại mã OTP (30s)";
        countdownSpan.textContent = countdown;
        const restartTimer = setInterval(() => {
          countdown--;
          countdownSpan.textContent = countdown;
          if (countdown <= 0) {
            resendBtn.disabled = false;
            resendBtn.textContent = "Gửi lại mã OTP";
            clearInterval(restartTimer);
          }
        }, 1000);
      } else {
        resendBtn.textContent = "Lỗi gửi lại!";
      }
    } catch (err) {
      console.error("Lỗi gửi lại OTP:", err);
      resendBtn.textContent = "Lỗi kết nối!";
    }
  });
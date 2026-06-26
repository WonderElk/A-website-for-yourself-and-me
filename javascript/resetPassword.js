import { supabase } from "./supabase.js";

const requestForm = document.getElementById("reset-request-form");
const requestStatus = document.getElementById("reset-status");
const requestSection = document.getElementById("request-section");
const passwordSection = document.getElementById("password-reset-section");
const passwordForm = document.getElementById("password-reset-form");
const passwordStatus = document.getElementById("password-status");
const passwordInput = document.getElementById("new-password");

function getRecoveryParams() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
    type: params.get("type"),
  };
}

async function initRecoveryFlow() {
  const { accessToken, refreshToken, type } = getRecoveryParams();
  if (type === "recovery" && accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (error) {
      passwordStatus.style.color = "red";
      passwordStatus.textContent =
        "The reset link could not be used: " + error.message;
      return;
    }

    requestSection.classList.add("hidden");
    passwordSection.classList.remove("hidden");
    passwordStatus.style.color = "";
    passwordStatus.textContent = "Choose a new password.";
  }
}

requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  requestStatus.style.color = "";
  requestStatus.textContent = "Sending reset email...";

  const email = requestForm.email.value.trim();
  const redirectTo = `${window.location.origin}/authors/reset-password.html`;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) {
    requestStatus.style.color = "red";
    requestStatus.textContent = error.message;
    return;
  }

  requestStatus.style.color = "green";
  requestStatus.textContent = "A reset link has been sent to your email.";
});

passwordForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  passwordStatus.style.color = "";
  passwordStatus.textContent = "Updating password...";

  const password = passwordInput.value;
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    passwordStatus.style.color = "red";
    passwordStatus.textContent = error.message;
    return;
  }

  passwordStatus.style.color = "green";
  passwordStatus.textContent = "Password updated successfully.";
  passwordForm.reset();
});

initRecoveryFlow();

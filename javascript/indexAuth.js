import { supabase } from "./supabase.js";

const authHeading = document.getElementById("auth-heading");
const signedInMessage = document.getElementById("signed-in-message");
const signedInEmail = document.getElementById("signed-in-email");
const logoutBtn = document.getElementById("index-logout-btn");
const loginForm = document.getElementById("index-login-form");
const loginError = document.getElementById("index-login-error");
const signInSection = document.getElementById("sign-in-section");

async function refreshAuthUI() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (user) {
    authHeading.textContent = "Signed in";
    signedInMessage.style.display = "block";
    signInSection.style.display = "none";
    signedInEmail.textContent = user.email ?? "";
  } else {
    authHeading.textContent = "Sign in";
    signedInMessage.style.display = "none";
    signInSection.style.display = "block";
    signedInEmail.textContent = "";
  }
}

async function initializeAuthUI() {
  await refreshAuthUI();
  supabase.auth.onAuthStateChange(() => {
    refreshAuthUI();
  });
  window.addEventListener("pageshow", () => {
    refreshAuthUI();
  });
}

initializeAuthUI();

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = error.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

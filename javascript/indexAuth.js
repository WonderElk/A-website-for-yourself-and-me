import { getCurrentUser, signIn, signOut } from "./backendAuth.js";

const authHeading = document.getElementById("auth-heading");
const signedInMessage = document.getElementById("signed-in-message");
const signedInEmail = document.getElementById("signed-in-email");
const logoutBtn = document.getElementById("index-logout-btn");
const loginForm = document.getElementById("index-login-form");
const loginError = document.getElementById("index-login-error");
const signInSection = document.getElementById("sign-in-section");

async function refreshAuthUI() {
  const user = await getCurrentUser();

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
  window.addEventListener("pageshow", () => {
    refreshAuthUI();
  });
}

initializeAuthUI();

/*loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    loginError.textContent = error.message;
  }
});*/

logoutBtn.addEventListener("click", async () => {
  signOut();
  await refreshAuthUI();
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;
  try {
    await signIn(email, password);
    await refreshAuthUI();
  } catch (error) {
    loginError.textContent = error.message;
  }
});

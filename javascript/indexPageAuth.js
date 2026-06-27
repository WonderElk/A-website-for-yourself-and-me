import { supabase } from "./supabase.js";

const signedInPanel = document.getElementById("index-signed-in-panel");
const signedInEmail = document.getElementById("index-signed-in-email");
const signedOutPanel = document.getElementById("index-signed-out-panel");
const logoutBtn = document.getElementById("index-logout-btn");

async function refreshIndexAuthUI() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (user) {
    signedInPanel.style.display = "block";
    signedOutPanel.style.display = "none";
    signedInEmail.textContent = user.email ?? "";
  } else {
    signedInPanel.style.display = "none";
    signedOutPanel.style.display = "block";
    signedInEmail.textContent = "";
  }
}

async function initializeIndexAuthUI() {
  await refreshIndexAuthUI();
  supabase.auth.onAuthStateChange(() => {
    refreshIndexAuthUI();
  });
  window.addEventListener("pageshow", () => {
    refreshIndexAuthUI();
  });
}

initializeIndexAuthUI();

logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
});

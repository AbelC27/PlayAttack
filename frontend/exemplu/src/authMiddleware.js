// src/authMiddleware.js
import { supabase } from "./supabaseClient";

const SEARCH_KEYS_TO_CLEAR = ["code", "type", "redirect_to"];
const HASH_KEYS_TO_CLEAR = [
  "access_token",
  "refresh_token",
  "expires_in",
  "token_type",
  "type",
  "provider_token",
];

const getHashParams = () => {
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) {
    return new URLSearchParams();
  }
  return new URLSearchParams(hash.substring(1));
};

const getSearchParams = () => {
  const search = window.location.search;
  if (!search || search.length <= 1) {
    return new URLSearchParams();
  }
  return new URLSearchParams(search.substring(1));
};

const clearSupabaseParams = () => {
  const searchParams = getSearchParams();
  const hashParams = getHashParams();

  SEARCH_KEYS_TO_CLEAR.forEach((key) => searchParams.delete(key));
  HASH_KEYS_TO_CLEAR.forEach((key) => hashParams.delete(key));

  let cleanedPath = window.location.pathname;
  const searchString = searchParams.toString();
  const hashString = hashParams.toString();

  if (searchString) {
    cleanedPath += `?${searchString}`;
  }

  if (hashString) {
    cleanedPath += `#${hashString}`;
  }

  window.history.replaceState({}, document.title, cleanedPath);
};

const isRecoveryRoute = () => {
  const path = window.location.pathname.toLowerCase();
  return path.includes("reset-password") || path.includes("forgot-password");
};

export const hasSupabaseRecoveryParams = () => {
  if (typeof window === "undefined") return false;

  const hashParams = getHashParams();
  const searchParams = getSearchParams();
  const type = hashParams.get("type") || searchParams.get("type");
  const code = searchParams.get("code");
  const accessToken = hashParams.get("access_token");

  // Check for hash-based recovery
  if (accessToken && type === "recovery") return true;

  // Check for code-based recovery
  if (code && isRecoveryRoute()) return true;

  return false;
};

export async function handleSupabaseRedirect() {
  if (typeof window === "undefined") {
    return;
  }

  const hashParams = getHashParams();
  const searchParams = getSearchParams();
  const type = hashParams.get("type") || searchParams.get("type");
  const code = searchParams.get("code");
  const accessToken = hashParams.get("access_token");
  const refreshToken = hashParams.get("refresh_token");
  const onRecoveryRoute = isRecoveryRoute();

  try {
    if (code && (type === "recovery" || onRecoveryRoute)) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Error exchanging Supabase recovery code:", error.message);
      }
      clearSupabaseParams();
      return;
    }

    if (type === "recovery" && accessToken && refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error("Error restoring Supabase session:", error.message);
      }
      clearSupabaseParams();
    }
  } catch (error) {
    console.error("Error handling Supabase redirect:", error);
  }
}

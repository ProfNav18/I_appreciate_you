(() => {
  "use strict";

  const SUPABASE_URL = "https://cqqzsagjrgajnvyarxth.supabase.co";
  const SUPABASE_ANON_KEY = "sb_publishable_iFPxkxE2uKqMRm1L2Edwcw_addc_teh";
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const form = document.getElementById("customizeForm");
  const submitBtn = document.getElementById("submitBtn");
  const resultBox = document.getElementById("resultBox");
  const resultLink = document.getElementById("resultLink");
  const errorBox = document.getElementById("errorBox");
  const copyBtn = document.getElementById("copyBtn");

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }

  async function uploadPhoto(orderId, index, file) {
    if (!file || !file.size) return null;
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${orderId}/${index}.${ext}`;
    const { error } = await supabaseClient.storage
      .from("couple-photos")
      .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
    if (error) throw error;
    const { data } = supabaseClient.storage.from("couple-photos").getPublicUrl(path);
    return data.publicUrl;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.hidden = true;
    submitBtn.disabled = true;
    submitBtn.textContent = "Creating...";

    try {
      const fd = new FormData(form);
      const orderId = crypto.randomUUID();

      const photoUrls = [];
      for (let i = 1; i <= 6; i++) {
        const url = await uploadPhoto(orderId, i, fd.get(`photo${i}`));
        photoUrls.push(url);
      }

      const letterParagraphs = fd
        .get("letterText")
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean);

      const gratitudeMessages = [1, 2, 3, 4, 5, 6].map((i) => fd.get(`msg${i}`).trim());

      const { error } = await supabaseClient.from("orders").insert({
        id: orderId,
        partner_name: fd.get("partnerName").trim(),
        signature_name: fd.get("signatureName").trim(),
        letter_paragraphs: letterParagraphs,
        gratitude_messages: gratitudeMessages,
        photo_urls: photoUrls,
      });
      if (error) throw error;

      const basePath = location.pathname.replace(/customize\.html$/, "");
      resultLink.value = `${location.origin}${basePath}?order=${orderId}`;
      resultBox.hidden = false;
      form.hidden = true;
    } catch (err) {
      showError("Something went wrong: " + (err.message || String(err)));
      submitBtn.disabled = false;
      submitBtn.textContent = "Create my link ✨";
    }
  });

  copyBtn.addEventListener("click", () => {
    resultLink.select();
    navigator.clipboard.writeText(resultLink.value).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
    });
  });
})();

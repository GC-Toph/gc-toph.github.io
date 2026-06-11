(function () {
  function b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);

    for (let i = 0; i < bin.length; i++) {
      bytes[i] = bin.charCodeAt(i);
    }

    return bytes;
  }

  async function deriveKey(password, salt, iterations) {
    const enc = new TextEncoder();

    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations,
        hash: "SHA-256"
      },
      baseKey,
      {
        name: "AES-GCM",
        length: 256
      },
      false,
      ["decrypt"]
    );
  }

  async function decryptPayload(payload, password) {
    const salt = b64ToBytes(payload.salt);
    const iv = b64ToBytes(payload.iv);
    const ct = b64ToBytes(payload.ct);
    const tag = b64ToBytes(payload.tag);

    const combined = new Uint8Array(ct.length + tag.length);
    combined.set(ct, 0);
    combined.set(tag, ct.length);

    const key = await deriveKey(password, salt, payload.iter);

    const plaintext = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv
      },
      key,
      combined
    );

    return new TextDecoder().decode(plaintext);
  }

  async function unlock(container, password) {
    const payloadText = container.getAttribute("data-encrypted-payload");
    const payload = JSON.parse(payloadText);

    const html = await decryptPayload(payload, password);

    container.outerHTML = html;

    if (window.MathJax && window.MathJax.typesetPromise) {
      window.MathJax.typesetPromise();
    }

    if (window.mermaid && window.mermaid.run) {
      window.mermaid.run();
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".encrypted-post").forEach(function (container) {
      const form = container.querySelector(".encrypted-post-form");
      const input = container.querySelector(".encrypted-post-password");
      const error = container.querySelector(".encrypted-post-error");

      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        error.hidden = true;

        try {
          await unlock(container, input.value);
        } catch (err) {
          error.hidden = false;
        }
      });
    });
  });
})();
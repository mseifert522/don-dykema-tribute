/* Tribute configuration — safe to edit */
window.TRIBUTE_CONFIG = {
  /* Where family notifications are emailed (FormSubmit).
     First submission sends a confirmation link to this inbox — click it once. */
  notifyEmail: "michaelseifert52@gmail.com",

  /* Public GitHub repo used as the guest-book database */
  githubOwner: "mseifert522",
  githubRepo: "don-dykema-tribute",

  /*
   * Optional: fine-grained PAT with ONLY this permission on THIS repo:
   *   Repository access: mseifert522/don-dykema-tribute (only)
   *   Permissions → Issues: Read and write
   *
   * Create at: https://github.com/settings/personal-access-tokens/new
   * When set, memories & photos appear on the wall instantly for everyone.
   * If left empty, submissions are still emailed to the family.
   */
  githubToken: ""
};

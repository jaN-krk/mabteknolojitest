declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    ADMIN_USER_IDS?: string;
    MAIL_API_KEY?: string;
    MAIL_FROM?: string;
    MAIL_TO?: string;
    MAIL_DELIVERY_URL?: string;
    FORM_SECRET?: string;
  }
}

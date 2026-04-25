export function mapSettings(row) {
  return {
    siteName: row.site_name,
    siteSubtitle: row.site_subtitle,
    siteEmail: row.site_email,
    announcement: row.announcement || "",
    allowComments: Boolean(row.allow_comments),
    themeDefault: row.theme_default
  };
}

export const IS_PUBLIC_SITE = import.meta.env?.MODE !== 'internal';
export const IS_ADMIN_PREVIEW = import.meta.env?.MODE === 'admin-preview';

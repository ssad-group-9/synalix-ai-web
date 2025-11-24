import CryptoJS from 'crypto-js'

/**
 * 生成Gravatar头像URL
 * @param email 用户邮箱
 * @param size 头像尺寸，默认40
 * @param defaultImage 默认头像类型，默认'mp'（神秘人）
 * @returns Gravatar头像URL
 */
export function getGravatarUrl(
  email: string | null,
  size: number = 40,
  defaultImage: string = 'mp',
): string {
  // 如果邮箱为空，使用空字符串
  const emailToHash = email ? email.trim().toLowerCase() : ''

  // 生成MD5哈希
  const hash = CryptoJS.MD5(emailToHash).toString()

  // 返回Gravatar URL
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`
}

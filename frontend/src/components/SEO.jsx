import React, { useEffect } from 'react';

const DEFAULT_TITLE = "노무체크AI - 2026 최저임금·월급209시간·임금체불·해고·산재 무료 AI 노무 진단";
const DEFAULT_DESC = "근로자와 사업주를 위한 대한민국 근로기준법 및 대법원 판례 기반 2026 노무 플랫폼. 월급·주휴수당·연차·퇴직금 계산기, AI 자가진단 리포트 무료 제공.";
const BASE_URL = "https://노무체크ai.com";

export default function SEO({
  title,
  description,
  keywords,
  path = '',
  ogImage = `${BASE_URL}/og-image.png`
}) {
  useEffect(() => {
    const pageTitle = title ? `${title} | 노무체크AI` : DEFAULT_TITLE;
    const pageDesc = description || DEFAULT_DESC;
    const currentUrl = `${BASE_URL}${path}`;

    // 1. Title
    document.title = pageTitle;

    // 2. Meta description & keywords
    let metaDesc = document.querySelector("meta[name='description']");
    if (metaDesc) metaDesc.setAttribute("content", pageDesc);

    if (keywords) {
      let metaKw = document.querySelector("meta[name='keywords']");
      if (metaKw) metaKw.setAttribute("content", keywords);
    }

    // 3. Open Graph
    let ogTitle = document.querySelector("meta[property='og:title']");
    if (ogTitle) ogTitle.setAttribute("content", pageTitle);

    let ogDesc = document.querySelector("meta[property='og:description']");
    if (ogDesc) ogDesc.setAttribute("content", pageDesc);

    let ogUrl = document.querySelector("meta[property='og:url']");
    if (ogUrl) ogUrl.setAttribute("content", currentUrl);

    let ogImg = document.querySelector("meta[property='og:image']");
    if (ogImg) ogImg.setAttribute("content", ogImage);

    // 4. Canonical Link
    let canonical = document.querySelector("link[rel='canonical']");
    if (canonical) canonical.setAttribute("href", currentUrl);

  }, [title, description, keywords, path, ogImage]);

  return null;
}

<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>XML Sitemap | Sri Sai Krishna Jewellers</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #0b0704;
            color: #f7eed7;
            margin: 0;
            padding: 3rem 1.5rem;
          }
          .container {
            max-width: 980px;
            margin: 0 auto;
          }
          .header-box {
            border-bottom: 1px solid rgba(212, 175, 55, 0.25);
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
          }
          .brand-tag {
            color: #f0c665;
            font-size: 0.8rem;
            letter-spacing: 2px;
            text-transform: uppercase;
            font-weight: 700;
          }
          h1 {
            color: #f3d47c;
            font-size: 1.85rem;
            margin: 0.4rem 0 0.5rem 0;
            letter-spacing: 0.5px;
          }
          p.desc {
            color: #bfb49e;
            font-size: 0.92rem;
            margin: 0;
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #161009;
            border: 1px solid rgba(212, 175, 55, 0.25);
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          }
          th {
            background: #241a0d;
            color: #f3d47c;
            text-align: left;
            padding: 14px 18px;
            font-size: 0.82rem;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            border-bottom: 1px solid rgba(212, 175, 55, 0.25);
          }
          td {
            padding: 16px 18px;
            font-size: 0.92rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
            vertical-align: top;
          }
          a {
            color: #f0c665;
            text-decoration: none;
            word-break: break-all;
          }
          a:hover {
            text-decoration: underline;
            color: #ffe699;
          }
          .img-list {
            margin: 0;
            padding: 0;
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 6px;
          }
          .img-list li {
            font-size: 0.84rem;
            color: #dfd7c5;
          }
          .badge {
            display: inline-block;
            background: rgba(212, 175, 55, 0.15);
            color: #f3d47c;
            border: 1px solid rgba(212, 175, 55, 0.4);
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header-box">
            <span class="brand-tag">Sri Sai Krishna Jewellers • Etikoppaka</span>
            <h1>Index XML Sitemap</h1>
            <p class="desc">
              This document is generated for search engine crawlers (Googlebot, Bingbot). It provides Google with verified canonical showroom URLs and high-resolution 22K 916 BIS Hallmarked jewellery catalog image assets.
            </p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Page URL</th>
                <th>Priority</th>
                <th>Change Frequency</th>
                <th>Last Modified</th>
                <th>Indexed Media</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <strong><a href="{sitemap:loc}"><xsl:value-of select="sitemap:loc"/></a></strong>
                  </td>
                  <td><span class="badge"><xsl:value-of select="sitemap:priority"/></span></td>
                  <td><xsl:value-of select="sitemap:changefreq"/></td>
                  <td><xsl:value-of select="sitemap:lastmod"/></td>
                  <td>
                    <ul class="img-list">
                      <xsl:for-each select="image:image">
                        <li>
                          📷 <a href="{image:loc}" target="_blank"><xsl:value-of select="image:title"/></a>
                        </li>
                      </xsl:for-each>
                    </ul>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

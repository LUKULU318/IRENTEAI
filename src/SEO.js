// src/SEO.js
import { Helmet } from "react-helmet-async";

const SEO = () => (
  <Helmet>
    <title>Tanzania Social Analyzer</title>
    <meta name="description" content="Analyze social media trends in Tanzania" />
    <meta property="og:type" content="website" />
  </Helmet>
);
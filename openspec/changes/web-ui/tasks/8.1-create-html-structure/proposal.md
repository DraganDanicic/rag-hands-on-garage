# Task 8.1: Proposal -- Create public/index.html with Base HTML Structure

## Context
Part of change: web-ui
Parent task: "8.1 Create public/index.html with base HTML structure"

## What
Create the foundational `public/index.html` file that serves as the single-page web UI for the RAG system. This file establishes the complete HTML5 document structure with semantic layout containers for all three major UI regions: sidebar (collections list + file upload), main area (chat interface), and a collapsible settings panel.

The file includes placeholder content and structural elements that subsequent tasks (8.2 through 8.5) will populate with detailed inner markup, styles, and interactivity. It also sets up the `<style>` and `<script>` blocks where CSS and JavaScript will be added by later tasks.

## Why
All frontend UI tasks (8.2--13.5) depend on a shared HTML document. Establishing the top-level structure first ensures that subsequent tasks can work in parallel without merge conflicts -- each task fills in a distinct region or section of the document. Having the layout containers defined upfront also prevents structural rework when adding sidebar, chat, and settings content.

The decision to use a single HTML file with inline CSS and JS (no build step) was made in the L1 design to keep the project simple and educational. This task creates that single file.

## Scope
- In scope:
  - HTML5 boilerplate (`<!DOCTYPE html>`, `<html>`, `<head>`, `<body>`)
  - `<meta>` tags for charset, viewport, and description
  - `<title>` element
  - Top-level layout containers: sidebar (`<aside>`), main area (`<main>`), settings panel (`<section>`)
  - Semantic sub-containers within each region (empty or with minimal placeholder IDs)
  - Empty `<style>` block in `<head>` (CSS added by task 8.5)
  - Empty `<script>` block at end of `<body>` (JS added by tasks 9.x--13.x)
  - Wrapper div for CSS grid/flexbox layout
  - Accessibility basics: `lang` attribute, semantic elements, ARIA landmarks where appropriate

- Out of scope:
  - Actual CSS rules (task 8.5)
  - Sidebar inner content -- collection list, upload zone (task 8.2)
  - Chat interface inner content -- message list, input form (task 8.3)
  - Settings panel inner content -- configuration inputs (task 8.4)
  - Any JavaScript functionality (tasks 9.x--13.x)
  - Responsive breakpoints or mobile layout (task 8.5)

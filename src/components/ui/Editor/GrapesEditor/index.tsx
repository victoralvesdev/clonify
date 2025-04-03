'use client';

import React, { useEffect, useRef, useState } from 'react';
import grapesjs from 'grapesjs';
import type { Editor, Plugin } from 'grapesjs';
import { ArrowLeft, Save, Laptop, Tablet, Smartphone, Download } from 'lucide-react';
import 'grapesjs/dist/css/grapes.min.css';
import '@/styles/grapesjs-theme.css';
import './editorStyles.css';
import webpagePlugin from 'grapesjs-preset-webpage';
import flexboxPlugin from 'grapesjs-blocks-flexbox';
import styleBgPlugin from 'grapesjs-style-bg';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Button } from '../../Button';
import { toast } from 'react-toastify';
import { SavedPage, savePage, updatePage, getSavedPages } from "@/data/SavedPages";
import NameInputDialog from "@/components/ui/NameInputDialog";

interface GrapesEditorProps {
  initialHtml?: string;
  initialCss?: string;
  editingPageId?: string | null;
  editingPageTitle?: string;
  onBack?: () => void;
  onSavePage?: (page: SavedPage) => void;
  onNavigate?: (tab: string) => void;
}

const GrapesEditor: React.FC<GrapesEditorProps> = ({ 
  initialHtml = '', 
  initialCss = '',
  editingPageId,
  editingPageTitle,
  onBack,
  onSavePage,
  onNavigate,
}) => {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [showNameInput, setShowNameInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tempPageData, setTempPageData] = useState<{html: string, css: string} | null>(null);
  const [activeDevice, setActiveDevice] = useState('Desktop');
  const currentEditingTitle = useRef(editingPageTitle || `Nova Página ${Date.now()}`);

  useEffect(() => {
    if (editor) {
       console.log("GrapesJS já inicializado.");
       return;
    }

    console.log("Inicializando GrapesJS...");

    let processedHtmlForEditor = initialHtml.replace(/<br\s*\/?>/gi, ' ');
    let processedCssForEditor = initialCss;

    const plugins: (string | Plugin)[] = [
        webpagePlugin,
        flexboxPlugin,
        styleBgPlugin,
    ];

    const pluginsOpts = {
      'gjs-preset-webpage': { exportOpts: false, showStylesOnChange: true },
      'grapesjs-blocks-flexbox': { /* opções */ },
      'grapesjs-style-bg': { /* opções */ },
    };

    const newEditor = grapesjs.init({
      container: '#gjs-editor',
      height: '100%',
      width: 'auto',
      storageManager: false,
      undoManager: { trackSelection: false },
      selectorManager: { componentFirst: true },
      components: processedHtmlForEditor,
      style: processedCssForEditor,

      panels: {
        defaults: [
          {
            id: 'views',
            el: '.panel__right .gjs-pn-views',
            buttons: [
              { id: 'show-styles', command: 'show-styles', label: 'Estilos', active: true, togglable: false },
              { id: 'show-traits', command: 'show-traits', label: 'Atributos', togglable: false },
              { id: 'show-layers', command: 'show-layers', label: 'Camadas', togglable: false },
            ],
          },
          {
            id: 'options',
            el: '.panel__left',
          }
        ]
      },

      blockManager: {
        appendTo: '.blocks-container',
        blocks: [
          // --- CATEGORIA SEÇÕES ---
          {
            id: 'hero-section', 
            label: 'Hero Section',
            category: 'Seções',
            content: '<div style="padding: 50px; text-align: center; background-color: #252525; color: #fff;">Conteúdo da Hero Section</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-template"><rect width="18" height="7" x="3" y="3" rx="1"/><rect width="9" height="7" x="3" y="14" rx="1"/><rect width="9" height="7" x="15" y="14" rx="1"/></svg>`
          },
          {
            id: 'cta-section', 
            label: 'CTA Section',
            category: 'Seções',
            content: '<div style="padding: 40px; text-align: center; background-color: #333; color: #fff;">Conteúdo da CTA Section</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-megaphone"><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>`
          },
          {
            id: 'pricing-section', 
            label: 'Seção de preços',
            category: 'Seções',
            content: '<div style="padding: 40px; background-color: #2d2d2d; color: #fff;">Seção de Preços</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-badge-dollar-sign"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="M12 7v10"/><path d="M15 10h-6a2 2 0 1 0 0 4h6"/></svg>`
          },
          {
            id: 'left-items-section', 
            label: 'Itens a esquerda',
            category: 'Seções',
            content: '<div style="display: flex; padding: 30px; background-color: #2a2a2a; color: #fff;"><div style="flex: 1; text-align: left; padding-right: 20px;">Conteúdo à Esquerda</div><div style="flex: 1;"></div></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-left"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="9" y1="3" y2="21"/></svg>`
          },
          {
            id: 'right-items-section', 
            label: 'Itens a direita',
            category: 'Seções',
            content: '<div style="display: flex; padding: 30px; background-color: #2a2a2a; color: #fff;"><div style="flex: 1;"></div><div style="flex: 1; text-align: right; padding-left: 20px;">Conteúdo à Direita</div></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-right"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="15" x2="15" y1="3" y2="21"/></svg>`
          },
          {
            id: 'center-items-section', 
            label: 'Itens ao centro',
            category: 'Seções',
            content: '<div style="padding: 30px; text-align: center; background-color: #2a2a2a; color: #fff;">Conteúdo ao Centro</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-align-center"><line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/></svg>`
          },
          
          // --- CATEGORIA COMPONENTES ---
          {
            id: 'header-comp', 
            label: 'Header',
            category: 'Componentes',
            content: '<div style="padding: 20px; background-color: #333; color: #fff;">Conteúdo do Header</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-top"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/></svg>`
          },
          {
            id: 'footer-comp', 
            label: 'Footer',
            category: 'Componentes',
            content: '<div style="padding: 30px; background-color: #222; color: #fff; text-align: center;">Conteúdo do Footer</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-panel-bottom"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="3" x2="21" y1="15" y2="15"/></svg>`
          },
          {
            id: 'resource-card-comp', 
            label: 'Card de Recurso',
            category: 'Componentes',
            content: '<div style="border: 1px solid #444; padding: 15px; text-align: center; background-color: #272727; color: #fff;">Card Recurso</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
          },
          {
            id: 'price-card-comp', 
            label: 'Card de Preços',
            category: 'Componentes',
            content: '<div style="border: 1px solid #444; padding: 15px; text-align: center; background-color: #272727; color: #fff;">Card Preços</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.432 0l6.568-6.568a2.426 2.426 0 0 0 0-3.432l-8.704-8.704Z"/><path d="M6 9h.01"/></svg>`
          },
          {
            id: 'testimonial-card-comp', 
            label: 'Card de Depoimento',
            category: 'Componentes',
            content: '<div style="border: 1px solid #444; padding: 15px; text-align: center; background-color: #272727; color: #fff;">Card Depoimento</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-text"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg>`
          },
          {
            id: 'contact-form-comp', 
            label: 'Formulário de contato',
            category: 'Componentes',
            content: '<form style="border: 1px solid #444; padding: 15px; background-color: #272727; color: #fff;"><label>Nome:</label><input type="text" style="display: block; width: 90%; margin-bottom: 10px; background-color: #333; color: #fff; border: 1px solid #555; padding: 5px;"/><label>Email:</label><input type="email" style="display: block; width: 90%; margin-bottom: 10px; background-color: #333; color: #fff; border: 1px solid #555; padding: 5px;"/><button type="submit" style="background-color: #444; color: #fff; border: none; padding: 8px 15px;">Enviar</button></form>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`
          },
          {
            id: 'divider-comp', 
            label: 'Divisor',
            category: 'Componentes',
            content: '<hr style="border-top: 1px solid #555; margin: 10px 0;" />',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-minus"><path d="M5 12h14"/></svg>`
          },
          {
            id: 'button-comp', 
            label: 'Botão',
            category: 'Componentes',
            content: '<button style="background-color: #444; color: #fff; border: none; padding: 10px 20px; cursor: pointer;">Botão</button>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/></svg>`
          },
          {
            id: 'h-title-comp', 
            label: 'H Título',
            category: 'Componentes',
            content: '<h1 style="color: #fff;">Título H1</h1>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heading-1"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/></svg>`
          },
          {
            id: 'text-comp', 
            label: 'Texto',
            category: 'Componentes',
            content: '<div data-gjs-type="text" style="color: #fff;">Insira seu texto</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pilcrow"><path d="M13 4v16"/><path d="M17 4v16"/><path d="M19 4H9.5a4.5 4.5 0 0 0 0 9H13"/></svg>`
          },
          {
            id: 'image-comp', 
            label: 'Imagem',
            category: 'Componentes',
            select: true,
            content: { type: 'image' },
            activate: true,
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-image"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`
          },
          {
            id: 'vsl-comp', 
            label: 'VSL',
            category: 'Componentes',
            content: '<div style="position: relative; padding-bottom: 56.25%; height: 0;"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play-square"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 8 6 4-6 4Z"/></svg>`
          },
          {
            id: 'spacer-comp', 
            label: 'Espaçador',
            category: 'Componentes',
            content: '<div style="height: 50px;"></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-move-vertical"><polyline points="8 18 12 22 16 18"/><polyline points="8 6 12 2 16 6"/><line x1="12" x2="12" y1="2" y2="22"/></svg>`
          },
          {
            id: 'icon-comp', 
            label: 'Ícone',
            category: 'Componentes',
            content: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`
          },
          
          // --- CATEGORIA BÁSICO ---
          {
            id: 'link-block-basic', 
            label: 'Link Block',
            category: 'Extra',
            content: '<a href="#" style="display: inline-block; padding: 10px; color: #00bcd4; text-decoration: none;">Link Block</a>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
          },
          {
            id: 'quote-basic', 
            label: 'Quote',
            category: 'Extra',
            content: '<blockquote style="border-left: 4px solid #444; padding: 10px 20px; margin-left: 0; color: #ccc; background-color: #272727;">Texto da citação aqui</blockquote>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`
          },
          {
            id: 'text-section-basic', 
            label: 'Text Section',
            category: 'Extra',
            content: '<section style="padding: 20px; background-color: #272727; color: #fff;"><h2>Título da Seção</h2><p>Texto da seção aqui...</p></section>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`
          },
          {
            id: 'one-column-basic', 
            label: '1 Column',
            category: 'Básico',
            content: '<div class="row" style="display: flex; flex-wrap: wrap; padding: 10px; background-color: #272727;"><div class="cell" style="flex: 0 0 100%; max-width: 100%; padding: 10px; background-color: #333; color: #fff;">Conteúdo da Coluna</div></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rectangle-vertical"><rect width="12" height="18" x="6" y="3" rx="2"/></svg>`
          },
          {
            id: 'two-columns-basic', 
            label: '2 Columns',
            category: 'Básico',
            content: '<div class="row" style="display: flex; flex-wrap: wrap; padding: 10px; background-color: #272727;"><div class="cell" style="flex: 0 0 50%; max-width: 50%; padding: 10px; background-color: #333; color: #fff;">Coluna 1</div><div class="cell" style="flex: 0 0 50%; max-width: 50%; padding: 10px; background-color: #333; color: #fff;">Coluna 2</div></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-columns-2"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="12" x2="12" y1="3" y2="21"/></svg>`
          },
          {
            id: 'three-columns-basic', 
            label: '3 Columns',
            category: 'Básico',
            content: '<div class="row" style="display: flex; flex-wrap: wrap; padding: 10px; background-color: #272727;"><div class="cell" style="flex: 0 0 33.3333%; max-width: 33.3333%; padding: 10px; background-color: #333; color: #fff;">Coluna 1</div><div class="cell" style="flex: 0 0 33.3333%; max-width: 33.3333%; padding: 10px; background-color: #333; color: #fff;">Coluna 2</div><div class="cell" style="flex: 0 0 33.3333%; max-width: 33.3333%; padding: 10px; background-color: #333; color: #fff;">Coluna 3</div></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-columns-3"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="9" x2="9" y1="3" y2="21"/><line x1="15" x2="15" y1="3" y2="21"/></svg>`
          },
          {
            id: 'two-columns-3-7-basic', 
            label: '2 Columns 3/7',
            category: 'Básico',
            content: '<div class="row" style="display: flex; flex-wrap: wrap; padding: 10px; background-color: #272727;"><div class="cell" style="flex: 0 0 30%; max-width: 30%; padding: 10px; background-color: #333; color: #fff;">Coluna 30%</div><div class="cell" style="flex: 0 0 70%; max-width: 70%; padding: 10px; background-color: #333; color: #fff;">Coluna 70%</div></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-panel-left"><rect width="18" height="18" x="3" y="3" rx="2"/><line x1="9" x2="9" y1="3" y2="21"/></svg>`
          },
          {
            id: 'link-basic', 
            label: 'Link',
            category: 'Básico',
            content: '<a href="#" style="color: #00bcd4; text-decoration: none;">Texto do Link</a>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`
          },
          {
            id: 'video-basic', 
            label: 'Video',
            category: 'Básico',
            content: '<div style="position: relative; padding-bottom: 56.25%; height: 0;"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" frameborder="0" allowfullscreen></iframe></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-video"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>`
          },
          {
            id: 'map-basic', 
            label: 'Mapa',
            category: 'Básico',
            content: '<div style="position: relative; padding-bottom: 56.25%; height: 0;"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.4426514259167!2d-46.63466548538952!3d-23.588494768469484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce5a2b2ed7f3a1%3A0xab35da2f5ca62674!2sPaulista%20Avenue%2C%20S%C3%A3o%20Paulo%20-%20State%20of%20S%C3%A3o%20Paulo!5e0!3m2!1sen!2sbr!4v1634345864061!5m2!1sen!2sbr" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0;" allowfullscreen="" loading="lazy"></iframe></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`
          },
          
          // --- CATEGORIA EXTRA ---
          {
            id: 'custom-code', 
            label: 'Custom Code',
            category: 'Extra',
            content: '<div style="padding: 15px; background-color: #222; color: #00ff00; font-family: monospace; border: 1px dashed #444;">// Seu código customizado aqui</div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`
          },
          {
            id: 'countdown', 
            label: 'Countdown',
            category: 'Extra',
            content: '<div style="padding: 15px; background-color: #272727; color: #fff; text-align: center;"><div style="display: flex; justify-content: center; gap: 10px;"><div style="background-color: #333; padding: 10px; border-radius: 5px;"><span style="font-size: 24px;">00</span><br/><small>Dias</small></div><div style="background-color: #333; padding: 10px; border-radius: 5px;"><span style="font-size: 24px;">00</span><br/><small>Horas</small></div><div style="background-color: #333; padding: 10px; border-radius: 5px;"><span style="font-size: 24px;">00</span><br/><small>Min</small></div><div style="background-color: #333; padding: 10px; border-radius: 5px;"><span style="font-size: 24px;">00</span><br/><small>Seg</small></div></div></div>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-timer"><path d="M10 2h4"/><path d="M12 14v-4"/><path d="M4 13a8 8 0 0 1 8-7 8 8 0 1 1-5.3 14L4 17.6"/><path d="M9 17H4v5"/></svg>`
          },
          {
            id: 'navbar', 
            label: 'Navbar',
            category: 'Extra',
            content: '<nav style="background-color: #333; padding: 10px; display: flex; justify-content: space-between; align-items: center;"><div style="color: #fff; font-weight: bold;">Logo</div><div><a href="#" style="color: #fff; text-decoration: none; margin: 0 10px;">Link 1</a><a href="#" style="color: #fff; text-decoration: none; margin: 0 10px;">Link 2</a><a href="#" style="color: #fff; text-decoration: none; margin: 0 10px;">Link 3</a></div></nav>',
            media: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>`
          }
        ]
      },
      layerManager: { appendTo: '.layers-container' },
      traitManager: { appendTo: '.traits-container' },
      styleManager: {
        appendTo: '.styles-container',
        sectors: [
            { name: 'Geral', open: true, properties: ['display', 'float', 'position', 'top', 'right', 'left', 'bottom'] },
            { name: 'Dimensão', open: false, properties: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'] },
            { name: 'Tipografia', open: false, properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration'] },
            { name: 'Decorações', open: false, properties: ['background-color', 'background-image', 'border', 'border-radius', 'box-shadow', 'opacity'] },
            { name: 'Extra', open: false, properties: ['transform', 'transition', 'perspective', 'cursor'] }
        ]
      },
       assetManager: {
         assets: [],
         upload: false,
       },
       plugins: plugins,
       pluginsOpts: pluginsOpts,
    });

    const commands = newEditor.Commands;
    const pn = newEditor.Panels;
    const mainContainer = document.querySelector('.grapesjs-editor-container');

    commands.add('show-layers', {
      run(editor, sender) {
        if (!mainContainer) return;
        const lmEl = mainContainer.querySelector('.layers-container') as HTMLElement | null;
        const smEl = mainContainer.querySelector('.styles-container') as HTMLElement | null;
        const trEl = mainContainer.querySelector('.traits-container') as HTMLElement | null;
        if (lmEl) lmEl.style.display = '';
        if (smEl) smEl.style.display = 'none';
        if (trEl) trEl.style.display = 'none';
        pn.getButton('views', 'show-layers')?.set('active', true);
        pn.getButton('views', 'show-styles')?.set('active', false);
        pn.getButton('views', 'show-traits')?.set('active', false);
      },
    });
    commands.add('show-styles', {
      run(editor, sender) {
        if (!mainContainer) return;
        const lmEl = mainContainer.querySelector('.layers-container') as HTMLElement | null;
        const smEl = mainContainer.querySelector('.styles-container') as HTMLElement | null;
        const trEl = mainContainer.querySelector('.traits-container') as HTMLElement | null;
        if (smEl) smEl.style.display = '';
        if (lmEl) lmEl.style.display = 'none';
        if (trEl) trEl.style.display = 'none';
        pn.getButton('views', 'show-styles')?.set('active', true);
        pn.getButton('views', 'show-layers')?.set('active', false);
        pn.getButton('views', 'show-traits')?.set('active', false);
      },
    });
    commands.add('show-traits', {
       run(editor, sender) {
        if (!mainContainer) return;
        const lmEl = mainContainer.querySelector('.layers-container') as HTMLElement | null;
        const smEl = mainContainer.querySelector('.styles-container') as HTMLElement | null;
        const trEl = mainContainer.querySelector('.traits-container') as HTMLElement | null;
        if (trEl) trEl.style.display = '';
        if (smEl) smEl.style.display = 'none';
        if (lmEl) lmEl.style.display = 'none';
        pn.getButton('views', 'show-traits')?.set('active', true);
        pn.getButton('views', 'show-styles')?.set('active', false);
        pn.getButton('views', 'show-layers')?.set('active', false);
      },
    });

    newEditor.on('load', () => {
        commands.run('show-styles');
        setIsLoading(false);
        console.log("GrapesJS Carregado e pronto.");
    });

    newEditor.on('change:device', () => {
      const device = newEditor.getDevice();
      setActiveDevice(device || 'Desktop');
    });

    setEditor(newEditor);
    currentEditingTitle.current = editingPageTitle || `Nova Página ${Date.now()}`;

    return () => {
      console.log("Destruindo instância GrapesJS.");
      if (newEditor) {
      newEditor.destroy();
      }
      setEditor(null);
    };
  }, []);

  useEffect(() => {
      currentEditingTitle.current = editingPageTitle || `Nova Página ${Date.now()}`;
  }, [editingPageTitle]);

  const handleSave = async (titleFromInput?: string) => {
    if (!editor) return;
    
    setIsLoading(true);
    const finalHtml = editor.getHtml();
    const finalCss = editor.getCss() || '';
    
    // Extrair título da tag <title> do HTML
    let extractedTitle = '';
    const titleMatch = finalHtml.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      extractedTitle = titleMatch[1].trim();
    }
    
    const pageTitle = titleFromInput || extractedTitle || currentEditingTitle.current || `Página Salva ${new Date().toLocaleTimeString()}`;

    let createdAt = new Date().toISOString();
    let originalUrlForSave = "";
    try {
      const baseMatch = finalHtml.match(/<base\s+href=['"]([^'"]+)['"]/i);
      if (baseMatch && baseMatch[1]) {
        originalUrlForSave = baseMatch[1];
      } else {
        const linkMatch = finalHtml.match(/<a\s+[^>]*href=['"](https?:\/\/[^'"]+)['"]/i);
        if (linkMatch && linkMatch[1]) {
           originalUrlForSave = new URL(linkMatch[1]).origin;
        }
      }
    } catch(e){ console.warn("Não foi possível extrair URL original para salvar.")}

    if (editingPageId) {
        try {
            const pages = await getSavedPages();
            const existingPage = pages.find(p => p.id === editingPageId);
            if (existingPage) {
                createdAt = existingPage.createdAt;
                if (!originalUrlForSave && existingPage.originalUrl) {
                   originalUrlForSave = existingPage.originalUrl;
                }
            }
        } catch (e) {
            console.error("Erro ao buscar página existente para createdAt:", e);
        }
    }

    const pageData: SavedPage = {
      id: editingPageId || `page_${Date.now()}`,
      title: pageTitle,
      html: finalHtml,
      css: finalCss,
      createdAt: createdAt,
      updatedAt: new Date().toISOString(),
      originalUrl: originalUrlForSave,
        thumbnail: '' 
    };

    try {
      if (editingPageId) {
        await updatePage(pageData);
        toast.success(`Página "${pageTitle}" atualizada!`);
      } else {
        await savePage(pageData);
        toast.success(`Página "${pageTitle}" salva!`);
        currentEditingTitle.current = pageTitle;
      }
    } catch (error) {
      console.error("Erro ao salvar página:", error);
      toast.error("Falha ao salvar a página.");
    } finally {
      setIsLoading(false);
      setShowNameInput(false);
    setTempPageData(null);
    }
  };

  const promptSave = () => {
    if (!editor) return;
    const html = editor.getHtml();
    const css = editor.getCss() || '';
    setTempPageData({ html, css });
    
    // Eliminar o prompt de nome - salvar diretamente com título extraído
    handleSave();
  };

  const handleDownload = () => {
     if (!editor) return;

     const htmlContent = editor.getHtml();
     const cssContent = editor.getCss() || '';

     const zip = new JSZip();
     zip.file('index.html', htmlContent);
     zip.file('style.css', cssContent);

     zip.generateAsync({ type: 'blob' }).then((content) => {
       saveAs(content, 'pagina_editada.zip');
       toast.success('Download iniciado!');
     }).catch(err => {
       console.error("Erro ao gerar ZIP:", err);
       toast.error('Falha ao gerar arquivo para download.');
     });
  };

  return (
    <div className="grapesjs-editor-container">
      <div className="flex items-center justify-between p-2 bg-[#162447] border-b border-[#2a3b6a] flex-shrink-0">
        <Button onClick={onBack} variant="ghost" size="sm" className="text-white hover:bg-[#2a3b6a]">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
           <Button onClick={() => editor?.setDevice('Desktop')} variant={activeDevice === 'Desktop' ? 'secondary' : 'ghost'} size="icon" className={`text-white ${activeDevice === 'Desktop' ? 'bg-[6a05ad]' : 'hover:bg-[#2a3b6a]'}`} title="Desktop"><Laptop className="h-5 w-5" /></Button>
           <Button onClick={() => editor?.setDevice('Tablet')} variant={activeDevice === 'Tablet' ? 'secondary' : 'ghost'} size="icon" className={`text-white ${activeDevice === 'Tablet' ? 'bg-[6a05ad]' : 'hover:bg-[#2a3b6a]'}`} title="Tablet"><Tablet className="h-5 w-5" /></Button>
           <Button onClick={() => editor?.setDevice('Mobile')} variant={activeDevice === 'Mobile' ? 'secondary' : 'ghost'} size="icon" className={`text-white ${activeDevice === 'Mobile' ? 'bg-[6a05ad]' : 'hover:bg-[#2a3b6a]'}`} title="Mobile"><Smartphone className="h-5 w-5" /></Button>
          </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDownload} variant="outline" size="sm" className="border-[#3d435a] text-white hover:bg-[#2d3348]" title="Download ZIP">
            <Download className="h-4 w-4" />
            </Button>
          <Button onClick={promptSave} variant="default" size="sm" className="bg-[6a05ad] hover:bg-[#c3006a] text-white">
            <Save className="mr-2 h-4 w-4" />
            Salvar
            </Button>
        </div>
      </div>

      <div className="editor-row">
        <div className="panel__left">
           <div className="blocks-container"></div>
        </div>
        
        <div className="editor-canvas-container">
           <div id="gjs-editor"></div>
        </div>
        
        <div className="panel__right">
           <div className="gjs-pn-views flex border-b border-[#2a3b6a]"></div>
           <div className="flex-1 overflow-y-auto relative">
             <div className="styles-container"></div>
             <div className="traits-container" style={{ display: 'none' }}></div>
             <div className="layers-container" style={{ display: 'none' }}></div>
          </div>
        </div>
      </div>
      
      <NameInputDialog 
        isOpen={showNameInput}
        onClose={() => setShowNameInput(false)}
        onConfirm={(name: string) => handleSave(name)}
        defaultName={currentEditingTitle.current.startsWith("Nova Página") ? "" : currentEditingTitle.current}
      />

      {isLoading && (
         <div className="fixed inset-0 bg-[#030617]/70 flex items-center justify-center z-[100]">
           <div className="text-center text-white">
             <div className="w-8 h-8 border-4 border-[6a05ad] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
             Salvando...
           </div>
         </div>
       )}
    </div>
  );
};

export default GrapesEditor; 
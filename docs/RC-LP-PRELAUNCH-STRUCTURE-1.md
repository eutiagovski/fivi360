# RC-LP-PRELAUNCH-STRUCTURE-1 — Landing Page de acesso antecipado

## Objetivo

Transformar `/lp/acesso-antecipado` em LP curta, premium e orientada a conversão, reutilizando o formulário existente e o **mesmo Viewer demonstrativo da Home** (sem `/embed` comercial).

**Build completo:** não executado.  
**Deploy:** não realizado.

---

## 1. Auditoria da Home

| Item | Achado |
|---|---|
| Demo | `LandingShowcase` + `useLandingDemo` + lazy `PanoramaViewer` |
| Config | `LANDING_DEMO` em `src/config/landingDemo.js` (agora alias de `FIVI360_DEMO_PROJECT`) |
| Carregamento | Firestore público (`getProjectById` + `getImagesByProjectIdPublic`) |
| Embed | **Não usa** `/embed/:projectId` |
| Hotspots | `useHotspots` + scene navigation (`SCENE_HOTSPOT_CONTEXT.LANDING_DEMO`) |
| Fullscreen Home | desligado por padrão |
| Loading | “Carregando demonstração…” + viewport gate (`useInViewport`) |
| Visual | `#050505`, zinc, Outfit/Manrope, CTAs `rounded-full` brancos |

**Nota:** `projectId` ainda é placeholder `COLOCAR_ID_DO_PROJETO_AQUI` — Home e LP compartilham o mesmo valor; a demo mostra fallback até o ID real ser preenchido.

---

## 2–3. Config compartilhada do demo

Fonte única:

`src/config/demoProject.js` → `FIVI360_DEMO_PROJECT`

```js
export const FIVI360_DEMO_PROJECT = {
  portfolioSlug: "fivi360",
  projectId: "COLOCAR_ID_DO_PROJETO_AQUI",
  portfolioPath: "/u/fivi360",
  projectPath: "/share/project/COLOCAR_ID_DO_PROJETO_AQUI",
};
```

`LANDING_DEMO` reexporta o mesmo objeto (Home sem duplicar ID).

Componente compartilhado: `LandingDemoExperience`  
Home (`LandingShowcase`) e LP (`AccessEarlyDemo`) consomem o mesmo stack.

---

## 4. Estrutura final da LP

```text
Header
Hero
Vídeo
Viewer / Experimente
Benefícios (3)
Como funciona (3 passos)
Transição → conversão
Acesso antecipado + Form
Footer
```

---

## 5. Hero

Headline: *Apresente seus projetos de um jeito que o cliente possa explorar.*  
Subheadline + CTA **Quero acesso antecipado** (scroll suave até `#acesso-antecipado`).  
Microcopy de condição especial sem %/preço.

---

## 6. Vídeo

`ACCESS_EARLY_CONFIG.videoUrl`  
Vazio → placeholder elegante (sem iframe).  
Preenchido → embed 16:9, `loading="lazy"`, title, fullscreen, **sem autoplay**.

---

## 7. Viewer

- `LandingDemoExperience` + `FIVI360_DEMO_PROJECT.projectId`
- Mesmo fluxo da Home (público, não embed)
- Fullscreen habilitado na LP (`showFullscreenCtrl`)
- Loading: “Carregando experiência 360°…”
- Erro: “Não foi possível carregar a demonstração agora.” (não quebra a página)
- Gate por viewport (não bloqueia First Paint)

---

## 8. Benefícios

Explore · Compartilhe · Incorpore (nota discreta Professional no embed).

---

## 9. Como funciona

01 Envie imagens 360°  
02 Conecte ambientes (hotspots)  
03 Compartilhe com o cliente  

---

## 10–12. Conversão / Form / WhatsApp

Reutiliza `AccessEarlyForm` + `AccessEarlySuccess` + `useAccessEarlyForm`.  
CTAs intermediários usam `scrollToAccessEarlyForm()`.  
WhatsApp permanece condicionado a `whatsappGroupUrl`.

---

## 13. Responsividade

Desktop: hero amplo, viewer protagonista, benefícios 3 colunas.  
Mobile: CTAs full-width quando faz sentido, viewer min-height adequado, seções empilhadas.

---

## 14. Performance

- Viewer lazy + `useInViewport`
- YouTube lazy quando configurado
- Sem listeners/Firestore extras além do fluxo da Home

---

## 15. SEO básico

`usePageSeo`:

- Title: `FIVI360 | Apresentações 360° para Arquitetura`
- Description: apresentações 360° para arquitetura

OG image custom: **pendente** (sem asset nesta sprint).

---

## 16. Analytics pendente (Polish)

Pontos preparados conceitualmente:  
`hero_cta_click`, `viewer_interaction`, `prelaunch_form_view`, `prelaunch_submit`, `prelaunch_success`, `prelaunch_duplicate`, `prelaunch_whatsapp_group_click`.

`handleWhatsAppGroupClick` já encapsula o CTA do grupo.

---

## 17. Arquivos

### Criados

- `src/config/demoProject.js` (+ test)
- `src/components/landing/LandingDemoExperience.jsx`
- `src/landing-pages/access-early/content.js` (+ test)
- `sections/AccessEarlyHeader|Hero|Video|Demo|Benefits|HowItWorks|Transition|Conversion|Footer`
- `sections/AccessEarlyVideo.test.jsx`
- `docs/RC-LP-PRELAUNCH-STRUCTURE-1.md`

### Alterados

- `src/config/landingDemo.js` → alias de `FIVI360_DEMO_PROJECT`
- `src/components/landing/LandingShowcase.jsx` → usa `LandingDemoExperience`
- `src/landing-pages/access-early/AccessEarlyLandingPage.jsx`
- `src/landing-pages/access-early/AccessEarlyLandingPage.test.jsx`
- `sections/index.js`

---

## 18. Testes

```bash
npm test -- --watchAll=false --testPathPattern="access-early|demoProject|PublicAlwaysRoute|routeArchitecture.lpRouting"
```

**12 suites / 54 passed**

Cobertura principal: hero/CTAs, vídeo vazio/configurado, demo compartilhado (não embed), 3 benefícios, 3 passos, form reutilizado, footer legal, UTMs, SEO hook, PUBLIC_ALWAYS.

---

## 19. Validação manual (checklist)

`/lp/acesso-antecipado?utm_source=instagram&utm_medium=stories&utm_campaign=prelaunch_2026&utm_content=editorial_01`

- [ ] Desktop: hero, vídeo placeholder, viewer, fullscreen, form, success  
- [ ] Mobile: sem overflow, viewer utilizável, form  
- [ ] Logado / deslogado: LP abre  
- [ ] Mesmo projectId da Home (após preencher ID real)  

---

## 20. Pendências Polish / go-live

- Preencher `FIVI360_DEMO_PROJECT.projectId` real  
- `videoUrl` YouTube  
- `whatsappGroupUrl` real  
- Desconto/cupom definitivo  
- Analytics completo  
- OG image  
- Rate limit / captcha (P1 DATA-1)  

---

## 21–22. Confirmações

| Item | Status |
|---|---|
| Identidade FIVI360 + Hero | Feito |
| Viewer = Home (não embed) | Feito |
| Form existente reutilizado | Feito |
| Fullscreen LP | Feito |
| Sem nova Function / listeners | Feito |
| Build completo | **Não executado** |
| Deploy | **Não realizado** |

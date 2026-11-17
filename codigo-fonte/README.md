# VN Studio

Aplicativo web para criar publicações do Vacaria News e baixar oito modelos de foto de perfil, usando o VN em vermelho, preto e branco.

Na aba Novas logos, há quatro estudos com as letras tradicionais do VN, sem fundo. É possível escrever um slogan opcional, posicioná-lo à direita ou embaixo e baixar PNG transparente ou SVG.

Na aba Criar, arraste a manchete na prévia ou use as posições rápidas. O texto do selo pode ser editado ou deixado vazio para ocultá-lo; as alterações também aparecem nos arquivos exportados.

Para entrevistas em vídeo, use a aba GC: o nome fica na faixa branca superior e a profissão na faixa vermelha inferior, com o VN no início. O GC pode ser baixado como PNG transparente compacto ou no quadro de vídeo 1920 x 1080. A tarja de notícias permanece separada na aba Criar, para imagens.

## Usar no celular

Depois de publicar o conteúdo de `dist/` em um endereço HTTPS, abra esse endereço no celular:

- Android: no Chrome, use o botão Instalar ou o menu do navegador e escolha Instalar app / Adicionar à tela inicial.
- iPhone: no Safari, toque em Compartilhar e depois em Adicionar à Tela de Início.

É um aplicativo web instalável (PWA), não um arquivo APK nem um aplicativo publicado em loja. Depois da primeira visita completa, o editor básico, a foto de exemplo e os arquivos locais podem funcionar sem conexão. Publicar ou compartilhar no Instagram depende do dispositivo e da conexão.

O rascunho, a foto do post e a logo do GC são armazenados apenas no navegador ou app deste aparelho, quando o armazenamento local está disponível. A foto usada só para prévia do GC não é salva nem incluída no PNG. Limpar os dados do navegador pode apagar os rascunhos. O aplicativo não agenda nem publica automaticamente no Instagram.

## Cópia fora do Arena

Na aba Novas logos, use **Publicar grátis em HTTPS** e **Preparar cópia com código-fonte**. Depois toque em **Salvar arquivo** ou use o compartilhamento do aparelho, quando disponível. Guarde o ZIP em um computador e outro local seguro. Ele contém `aplicativo-pronto/` e `codigo-fonte/`. As fotos, logos enviadas e os rascunhos do navegador não estão no ZIP.

No computador, é possível descompactar e abrir `aplicativo-pronto/index.html` em um navegador. Para instalar no celular, publique a pasta `aplicativo-pronto/` na raiz de um endereço HTTPS. O funcionamento do armazenamento ao abrir o HTML diretamente pode variar conforme o navegador; a cópia no cache do celular não substitui o ZIP.

Para uma hospedagem gratuita, o botão **Preparar pacote para publicar** gera um ZIP com `index.html` na raiz. No painel do Cloudflare Pages, crie um projeto por Direct Upload e envie esse ZIP. O projeto recebe um endereço `pages.dev` em HTTPS. Confira os limites e a visibilidade configurada na conta: o site pode ficar público. Fotos e rascunhos continuam locais a cada aparelho.

Se o navegador bloquear o ZIP, tente abrir a página fora da prévia do Arena e usar **Compartilhar / Salvar em Arquivos**. Há também uma alternativa de HTML único para os editores, mas ela não inclui sozinha a instalação offline nem o código-fonte.

## Desenvolvimento

```sh
npm install
npm run dev
```

Para gerar a versão de produção:

```sh
npm run build
```

Publique toda a pasta `dist/`, incluindo `sw.js`, `manifest.webmanifest` e `icons/`. O service worker só é registrado em produção em uma origem segura, como HTTPS ou localhost.

Para atualizar a cópia completa baixável, execute `node scripts/create-portable-backup.mjs`. O script faz um build com marcador vazio, gera o backup e faz o build final com a cópia embutida. A pasta `public/backup/` e a cópia embutida completa não são incluídas recursivamente no próprio backup.

As prévias e os desenhos dos perfis ficam em `src/data/profileLogos.ts`; os arquivos PNG, JPG e ZIP são gerados no próprio navegador. Para gerar também cópias físicas dos arquivos em `public/perfis/`, execute `node scripts/generate-profile-assets.mjs`.
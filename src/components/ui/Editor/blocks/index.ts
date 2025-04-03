import { Editor } from 'grapesjs';

export function registerCustomBlocks(editor: Editor) {
  // Bloco de Cabeçalho
  editor.BlockManager.add('custom-header', {
    label: 'Cabeçalho',
    category: 'Básico',
    content: `
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 class="text-3xl font-bold text-gray-900">
            Título do Site
          </h1>
        </div>
      </header>
    `,
  });

  // Bloco de Hero
  editor.BlockManager.add('custom-hero', {
    label: 'Hero',
    category: 'Básico',
    content: `
      <div class="relative bg-white overflow-hidden">
        <div class="max-w-7xl mx-auto">
          <div class="relative z-10 pb-8 bg-white sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div class="sm:text-center lg:text-left">
                <h1 class="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span class="block xl:inline">Seu Título</span>
                  <span class="block text-indigo-600 xl:inline">Principal Aqui</span>
                </h1>
                <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Texto descritivo do seu site ou produto. Use este espaço para explicar melhor sua proposta de valor.
                </p>
                <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div class="rounded-md shadow">
                    <a href="#" class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                      Começar
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    `,
  });

  // Bloco de Features
  editor.BlockManager.add('custom-features', {
    label: 'Features',
    category: 'Básico',
    content: `
      <div class="py-12 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="lg:text-center">
            <h2 class="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
            <p class="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Uma Melhor Maneira de Fazer
            </p>
            <p class="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Descrição das principais características do seu produto ou serviço.
            </p>
          </div>

          <div class="mt-10">
            <div class="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
              <div class="relative">
                <dt>
                  <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <!-- Icon -->
                  </div>
                  <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Feature 1</p>
                </dt>
                <dd class="mt-2 ml-16 text-base text-gray-500">
                  Descrição detalhada da primeira feature.
                </dd>
              </div>

              <div class="relative">
                <dt>
                  <div class="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                    <!-- Icon -->
                  </div>
                  <p class="ml-16 text-lg leading-6 font-medium text-gray-900">Feature 2</p>
                </dt>
                <dd class="mt-2 ml-16 text-base text-gray-500">
                  Descrição detalhada da segunda feature.
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
  });

  // Bloco de Contato
  editor.BlockManager.add('custom-contact', {
    label: 'Formulário de Contato',
    category: 'Formulários',
    content: `
      <div class="py-12 bg-white">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="max-w-md mx-auto">
            <h2 class="text-3xl font-extrabold text-gray-900 text-center mb-8">
              Entre em Contato
            </h2>
            <form class="grid grid-cols-1 gap-6">
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700">Nome</label>
                <input type="text" name="name" id="name" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" id="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
              </div>
              <div>
                <label for="message" class="block text-sm font-medium text-gray-700">Mensagem</label>
                <textarea name="message" id="message" rows="4" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
              </div>
              <div>
                <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  Enviar Mensagem
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `,
  });
} 
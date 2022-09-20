# Preparando o ambiente
### Dependencias
- node >= 14
- yarn
- https://smallsharpsoftwaretools.com/tutorials/use-colima-to-run-docker-containers-on-macos/

É recomendado a utilização do [nvm](https://github.com/nvm-sh/nvm) ou [asdf](https://asdf-vm.com/guide/getting-started.html#_1-install-dependencies) para ter a capacidade de trocar de versões do node de acordo com a necessidade.
### Configuração VS Code
Para seguir uma padronização e estilo de código o projeto esta configurado para utilizar o as extenções do vscode.
- [Eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) 
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

---
### Instalando dependencias
```
yarn
```
## Debug
Este projeto já esta configurado para realizar o debug com o vscode.

- No menu lateral esquerdo no item debug.
- selecione a opção `Debug card ms` 
- clique no botão play ou aperte a tecla `F5`

## Commit e Push
Este projeto esta configurado para utilizar [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/), [Commit Lint](https://github.com/conventional-changelog/commitlint) e [Commitizen](https://github.com/commitizen/cz-cli) para facilitar e padronizar os commits.
- adicione os arquivos que deseja realzar o commit utilizando o `git add` ou o menu lateral esquerdo do vs code.
- execute o commando `yarn commit` no console
- uma lista de opções será exibida
- Selecione a que se adeque ao seu commit

No momento do push os testes serão executados e o build será realizado para validar que esta tudo correto. Em caso de erro será necessário corrigir para poder realizar o push.

# Estrutura de Pasta
## src
nesta pasta devem ficar apenas arquivos para a inicialização do serviços e já contam com:
- Application.ts - responsavel por configurar a aplicação e iniciar o servidor http utilizando a lib [express]()
- Server.ts - entrypoint da aplicação, ele que inicia a aplicação como um todo.
- Configuration.ts - Todos os valores de variaveis de ambiente, feature flag, chaves devem ser mapeadas nele.
- ConfigureServices.ts - Toda a parte de configuração de injeção de dependencia feita aqui e utilizando a lib [inversify]()
## controllers
Implementações dos endpoints, obter dados da request, validação de entrada de dados. 

Nomeclatura dos arquivos `Recurso.Controller.ts`

## libs
Idealmente essas libs devem ser publicadas no repositorio npm privado. Mas como até o momento não houve a necessidade elas estão dentro do deste serviço.
- app-api - Menor abstração possivel para não haver dependencias entre as bibliotecas, as interfaces mais basicas. Ex: ILogger e ICacheProvider 
- app-cache-memory - Implementação da interface ICacheProvider para cache em memoria utilizando a lib `node-cache`
- app-cache-redis - Implementação da interface ICacheProvider para cahce utilizando Redis.
- app-config - Abstração para multiplos provedores de configuração. 
   - provedores: 
      - default: dotenv, carrega as variaveis de ambiente e arquivos .env
      - app-config-yaml: carrega variaveis de arquivos yamls
      - app-config-azure-appconfiguration: carrega valores, feature toogles e chaves do Azure App Configuration e Key Vault
      - AWS Config: carrega valores do Aws Config (Em Desenvolvimento)
- app-context-manager - abstração da [async hook node](https://nodejs.org/api/async_hooks.html) para gerenciamento de contexto. Ex: iniciado no `utils/middleware/contextMiddleware.ts` e consumido em `IoC/Interceptors/TsysInterceptor` e para evitar encadeamento de passagem de argumentos.
- app-log - Implementação da ILogger utilizado para realizar todo o log da aplicação. É possivel utilizar as libs [Pino](https://github.com/pinojs/pino) e [Bunyan](https://www.npmjs.com/package/bunyan).
- app-startup - Helper para inicialização da aplicação de forma fluente. ex: `src/server.ts`
- http-client - Wrapper da lib [axios]() com suporte a logs padronizados, estrategias de autenticação (ex: `utils/OAFAuthorization.ts`), interceptors tipados (ex: `IoC/Interceptors`) 
- http-resiliency - Adapter do [axios]() para implementação de padrões de resiliencia (timeout, retry, circuit break, cache, bulkhead) utilizando a lib [cockatiel]() e deve ser utilizada em conjunto com a `http-client`
- http-soap - Abstração da lib [soap]() para utilizar as libs `http-resiliency` e `http-client` padronizando os logs e resiliencia e suporte a interceptor.
## routes
arquivos dentro desta pasta são gerados pela lib [tsoa]() atraves do comando `build:routes` e não devem ser alterados manualmente, esses arquivos não são comitados e devem ficar no `.gitignore`

## docs
o arquivo `swagger.json` é gerado pela lib [tsoa]() atraves do comando `build:routes` e não devem ser alterados manualmente, esse arquivo não é comitado e deve ficar no `.gitignore`. para uma experiencia de desenvolvimento utilizamos a lib [swagger-ui-express]()
para exibir em uma interface essa documentação, que pode ser acessada atraves da url `http:\\localhost:[port]\docs`

## services
Nesta pasta devem ficar a implementações com as regras de orquestração de serviços.

## utils
Implementações que visão simplificar o dia a dia do desenvolvimento e fazem parte do especificamente do serviço

# Scripts
- `preinstall` - é executado automaticamente antes de instalar as dependencias
- `run` - roda o projeto da pasta `dist`
- `run:debug` - roda o projeto direto da pasta `src`com o nodemon
- `docker:start` - roda o projeto dentro do docker com docker compose
- `docker:startd` - roda o projeto dentro do docker desatachado com docker compose
- `docker:stop` - para de rodar o docker do projeto
- `docker:build` - faz o build da imagem docker
- `docker:test` - roda os testes com o docker e exporta o resultado para a pasta `out`
- `docker:sonar` - rodar o sonar com o docker
- `build:clean` - limpa a pasta `dist`
- `build:tsc` - transpila o código para javascript e a saida é na pasta `dist`
- `build:minify` - minifica o código em javascript da pasta `dist`
- `build:routes` - gera os arquivos `src/routes/routes.ts` e `src/docs/swagger.json` 
- `build` - executa a na sequencia correta o clean -> routes -> tsc
- `test` - executa os testes do projeto utilizando `jest`
- `prepare` - prepara o husky
- `commit` - inicia o processo de commit utilizando o `git-cz`
- `format` - formata e verifica o padrão todos arquivos `.js` `.ts` dentro da pasta src
- `format:staged` - formata e verifica o padrão todos arquivos `.js` `.ts` que estão em no stage do git, utilizado pelo husky
# Dependencias importantes
- tsoa
- jest
- cockatiel
- cls-hooked
- express
- hpropagate
- inversify
- pino
- bunyan
- axios
- opentelemetry
- joi
- husky

## SONAR DOCKER

https://medium.com/@deeksha.sharma25/set-up-sonarqube-for-javascript-application-c0f605146998

docker run -d --name SonarQube -p 9000:9000 -p 9092:9092 sonarqube

yarn docker:sonar --build-arg SONAR_LOGIN=b37a68f0685bc737d94077635d7724cd0bddbdc9 --build-arg SONAR_URL=http://localhost:9000 --network='host'


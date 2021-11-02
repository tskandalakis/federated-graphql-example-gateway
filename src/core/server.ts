'use strict';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway';
import promBundle from 'express-prom-bundle';
import morgan from 'morgan';

export async function init(config: any): Promise<Express.Application> {
  try {
    const app = express();

    // logging
    morgan.token('funcType', (req: any, res: any) => {
      return (req.body && req.body.operationName) ? req.body.operationName : 'Empty Operation Name';
    });
    app.use(morgan(':date[iso] :method :url :funcType :status - :response-time ms', {
      skip: (req: any, res:any) => { return (req.body && req.body.operationName === 'IntrospectionQuery'); }
    }));

    // metrics
    app.use(promBundle({
      includePath: true,
      includeMethod: false,
      includeStatusCode: true,
      customLabels: { operationName: ''},
      transformLabels: (labels, req, res) => {
        labels.operationName = (req.body && req.body.operationName) ? req.body.operationName : 'Empty Operation Name';
        return labels;
      }
    }));

    // Configure gateway context forwarding
    class AuthenticatedDataSource extends RemoteGraphQLDataSource {
      willSendRequest({ request, context }: { request: any, context: any }) {
        if(context.token) {
           request.http.headers.set('Authorization', context.token);
        }
      }
    }

    const gateway = new ApolloGateway({
      serviceList: [
        { name: 'user', url: `${config.graphqlServicePaths.user}/graphql` },
        // { name: 'book', url: `${config.graphqlServicePaths.book}/graphql` },
        // Define additional services here
      ],
      buildService({ name, url }) {
        return new AuthenticatedDataSource({ url });
      },
    });

    // await gateway.load();

    const server = new ApolloServer({
      gateway,
      context: ({ req }) => {
        // Request context can be set here... can set auth or permissions contexts to be accessed in resolvers.

        const token = req.headers.authorization || null;
        return {
          token,
        };
      },
      plugins: []
    });

    await server.start();
    server.applyMiddleware({ app, path: config.path });

    app.listen(config.port, () => {
      console.info(`Node Express server listening on http://localhost:${config.port}${server.graphqlPath}`);
    });

    return app;
  } catch (err) {
    console.error('error starting server');
    throw err;
  }
}

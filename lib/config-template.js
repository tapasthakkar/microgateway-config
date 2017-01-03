scopes:
{{#deployments}}
  {{scope}}:
    proxies:
      {{#bundles}}
        {{{this}}}
      {{/bundles}}
{{/deployments}}

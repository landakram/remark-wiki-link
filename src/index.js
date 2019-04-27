import 'babel-polyfill';
import map from 'unist-util-map';

const LINK_REGEX = /^\[\[(.+?)\]\]/;

function locator (value, fromIndex) {
  return value.indexOf('[', fromIndex)
}

function wikiLinkPlugin(opts = {}) {
    let permalinks = opts.permalinks || [];
    let defaultPageResolver = (name) => [name.replace(/ /g, '_').toLowerCase()];
    let pageResolver = opts.pageResolver || defaultPageResolver
    let newClassName = opts.newClassName || 'new';
    let wikiLinkClassName = opts.wikiLinkClassName || 'internal';
    let defaultHrefTemplate = (permalink) => `#/page/${permalink}`
    let hrefTemplate = opts.hrefTemplate || defaultHrefTemplate

    function isAlias(pageTitle) {
        return pageTitle.includes(':')
    }

    function parseAliasLink(pageTitle) {
        var [name, displayName] = pageTitle.split(':')
        return { name, displayName }
    }

    function parsePageTitle(pageTitle) {
        if (isAlias(pageTitle)) {
            return parseAliasLink(pageTitle)
        }
        return {
            name: pageTitle,
            displayName: pageTitle
        }
    }

    function inlineTokenizer(eat, value) {
        let match = LINK_REGEX.exec(value);

        if (match) {
            const pageName = match[1].trim();
            const { name, displayName } = parsePageTitle(pageName)

            let pagePermalinks = pageResolver(name);
            let permalink = pagePermalinks.find(p => permalinks.includes(p));
            let exists = permalink != undefined;

            if (!exists) {
                permalink = pagePermalinks[0];
            }

            let classNames = wikiLinkClassName;
            if (!exists) {
                classNames += ' ' + newClassName;
            }

            return eat(match[0])({
                type: 'wikiLink',
                value: name,
                data: {
                    alias: displayName,
                    permalink: permalink,
                    exists: exists,
                    hName: 'a',
                    hProperties: {
                        className: classNames,
                        href: hrefTemplate(permalink)
                    },
                    hChildren: [{
                        type: 'text',
                        value: displayName
                    }]
                },
            });
        }
    }

    inlineTokenizer.locator = locator

    const Parser = this.Parser

    const inlineTokenizers = Parser.prototype.inlineTokenizers
    const inlineMethods = Parser.prototype.inlineMethods
    inlineTokenizers.wikiLink = inlineTokenizer
    inlineMethods.splice(inlineMethods.indexOf('link'), 0, 'wikiLink')

    // Stringify for wiki link
    const Compiler = this.Compiler

    if (Compiler != null) {
        const visitors = Compiler.prototype.visitors
        if (visitors) {
            visitors.wikiLink = function (node) {
                if (node.data.alias != node.value) {
                    return `[[${node.value}:${node.data.alias}]]`
                }
                return `[[${node.value}]]`
            }
        }
    }
}

module.exports = wikiLinkPlugin

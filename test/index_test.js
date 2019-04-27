const assert = require('assert');
const unified = require('unified')
const markdown = require('remark-parse')
const visit = require('unist-util-visit');
const remark2markdown = require('remark-stringify');

const wikiLinkPlugin = require('../lib/index.js');


describe("remark-wiki-link", () => {
  it("parses a wiki link that has a matching permalink", () => {
    let processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          permalinks: ['wiki_link']
        });

    var ast = processor.parse('[[Wiki Link]]');
    ast = processor.runSync(ast);

    visit(ast, 'wikiLink', (node) => {
      assert.equal(node.data.exists, true)
      assert.equal(node.data.permalink, 'wiki_link')
      assert.equal(node.data.hName, 'a')
      assert.equal(node.data.hProperties.className, 'internal')
      assert.equal(node.data.hProperties.href, '#/page/wiki_link')
      assert.equal(node.data.hChildren[0].value, 'Wiki Link')
    })
  })

  it("parses a wiki link that has no matching permalink", () => {
    let processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          permalinks: []
        });

    var ast = processor.parse('[[New Page]]');
    ast = processor.runSync(ast);

    visit(ast, 'wikiLink', (node) => {
      assert.equal(node.data.exists, false)
      assert.equal(node.data.permalink, 'new_page')
      assert.equal(node.data.hName, 'a')
      assert.equal(node.data.hProperties.className, 'internal new')
      assert.equal(node.data.hProperties.href, '#/page/new_page')
      assert.equal(node.data.hChildren[0].value, 'New Page')
    })
  });

  it("handles wiki links with aliases", () => {
    let processor = unified()
        .use(markdown)
        .use(wikiLinkPlugin, {
          permalinks: []
        });

    var ast = processor.parse('[[Real Page:Page Alias]]');
    ast = processor.runSync(ast);

    visit(ast, 'wikiLink', (node) => {
      assert.equal(node.data.exists, false)
      assert.equal(node.data.permalink, 'real_page')
      assert.equal(node.data.hName, 'a')
      assert.equal(node.data.alias, 'Page Alias')
      assert.equal(node.value, 'Real Page')
      assert.equal(node.data.hProperties.className, 'internal new')
      assert.equal(node.data.hProperties.href, '#/page/real_page')
      assert.equal(node.data.hChildren[0].value, 'Page Alias')
    })
  });

  it("stringifies wiki links", () => {
    let processor = unified()
        .use(markdown, { gfm: true, footnotes: true, yaml: true })
        .use(remark2markdown)
        .use(wikiLinkPlugin, { permalinks: ['wiki_link'] })

    let stringified = processor.processSync('[[Wiki Link]]').contents.trim();
    assert.equal(stringified, '[[Wiki Link]]');
  });

  it("stringifies aliased wiki links", () => {
    let processor = unified()
        .use(markdown, { gfm: true, footnotes: true, yaml: true })
        .use(remark2markdown)
        .use(wikiLinkPlugin)

    let stringified = processor.processSync('[[Real Page:Page Alias]]').contents.trim();
    assert.equal(stringified, '[[Real Page:Page Alias]]');
  });

  context("configuration options", () => {
    it("uses pageResolver", () => {
      let identity = (name) => [name];

      let processor = unified()
          .use(markdown)
          .use(wikiLinkPlugin, {
            pageResolver: identity,
            permalinks: ["A Page"]
          });

      var ast = processor.parse('[[A Page]]');
      ast = processor.runSync(ast);

      visit(ast, 'wikiLink', (node) => {
        assert.equal(node.data.exists, true)
        assert.equal(node.data.permalink, 'A Page')
        assert.equal(node.data.hProperties.href, '#/page/A Page')
      })
    });

    it("uses newClassName", () => {
      let processor = unified()
          .use(markdown)
          .use(wikiLinkPlugin, {
            newClassName: "new_page"
          });

      var ast = processor.parse('[[A Page]]');
      ast = processor.runSync(ast);

      visit(ast, 'wikiLink', (node) => {
        assert.equal(node.data.hProperties.className, "internal new_page")
      })
    });

    it("uses hrefTemplate", () => {
      let processor = unified()
          .use(markdown)
          .use(wikiLinkPlugin, {
            hrefTemplate: (permalink) => permalink
          });

      var ast = processor.parse('[[A Page]]');
      ast = processor.runSync(ast);

      visit(ast, 'wikiLink', (node) => {
        assert.equal(node.data.hProperties.href, 'a_page')
      })
    });

    it("uses wikiLinkClassName", () => {
      let processor = unified()
          .use(markdown)
          .use(wikiLinkPlugin, {
            wikiLinkClassName: 'wiki_link',
            permalinks: ['a_page']
          });

      var ast = processor.parse('[[A Page]]');
      ast = processor.runSync(ast);

      visit(ast, 'wikiLink', (node) => {
        assert.equal(node.data.hProperties.className, "wiki_link")
      })
    });
  });
});

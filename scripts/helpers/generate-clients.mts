#!/usr/bin/env zx
import 'zx/globals';
import { createFromRoot } from 'codama';
import { renderVisitor as renderJavaScriptVisitor } from '@codama/renderers-js';
import { renderVisitor as renderRustVisitor } from '@codama/renderers-rust';
import { workingDirectory } from './utils.mts';

// Instanciate Codama.
const idl = JSON.parse(
  fs.readFileSync(path.join(workingDirectory, 'program', 'idl.json'), 'utf-8')
);
const codama = createFromRoot(idl);

// Render JavaScript.
const jsClient = path.join(__dirname, '..', '..', 'clients', 'js');
const prettierOptions = JSON.parse(
  fs.readFileSync(path.join(jsClient, '.prettierrc.json'), 'utf-8')
);
codama.accept(
  renderJavaScriptVisitor(path.join(jsClient, 'src', 'generated'), {
    prettierOptions,
  })
);

// Render Rust.
const rustClient = path.join(__dirname, '..', '..', 'clients', 'rust');
codama.accept(
  renderRustVisitor(path.join(rustClient, 'src', 'generated'), {
    formatCode: true,
    crateFolder: rustClient,
    anchorTraits: false,
  })
);

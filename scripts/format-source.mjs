import ts from 'typescript';
import fs from 'node:fs';
// Canonical TypeScript formatting, preserving authored comments and template text.
const files=process.argv.slice(2);
const printer=ts.createPrinter({newLine:ts.NewLineKind.LineFeed});
for(const file of files){
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 const result=ts.transform(source,[context=>root=>{
  const visit=node=>{node=ts.visitEachChild(node,visit,context);if(ts.isBlock(node)){const block=context.factory.createBlock(node.statements,true);ts.setOriginalNode(block,node);ts.setTextRange(block,node);return block;}return node;};
  return ts.visitNode(root,visit);
 }]);
 fs.writeFileSync(file,printer.printFile(result.transformed[0]));result.dispose();
}

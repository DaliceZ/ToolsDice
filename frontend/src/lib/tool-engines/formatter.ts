export type CodeLanguage = "json" | "javascript" | "html" | "css" | "sql";
export type CodeOperation = "format" | "minify";

export function transformCode(source: string, language: CodeLanguage, operation: CodeOperation): string {
  if (!source.trim()) return "";
  if (language === "json") {
    try {
      return JSON.stringify(JSON.parse(source) as unknown, null, operation === "minify" ? 0 : 2);
    } catch {
      throw new Error("JSON ไม่ถูกต้อง ตรวจเครื่องหมายคำพูด วงเล็บ และ comma");
    }
  }
  if (operation === "minify") {
    if (language === "html") return minifyHtml(source);
    if (language === "css") return minifyCss(source);
    if (language === "sql") return minifySql(source);
    return minifyJavaScript(source);
  }
  if (language === "sql") return formatSql(source);
  if (language === "html") return formatHtml(source);
  if (language === "css") return formatCss(source);
  return formatJavaScript(source);
}

function formatSql(source: string): string {
  const clausePattern = /^(LEFT\s+JOIN|RIGHT\s+JOIN|INNER\s+JOIN|GROUP\s+BY|ORDER\s+BY|INSERT\s+INTO|DELETE\s+FROM|SELECT|FROM|WHERE|JOIN|HAVING|LIMIT|VALUES|UPDATE|SET|AND|OR)\b/iu;
  let output = "";
  let index = 0;
  let pendingSpace = false;
  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1] ?? "";
    if (/\s/u.test(current)) {
      pendingSpace = true;
      index += 1;
      continue;
    }
    if (current === "'" || current === "\"" || current.charCodeAt(0) === 96) {
      output = appendSqlSpace(output, current, pendingSpace);
      pendingSpace = false;
      const quoted = copySqlQuoted(source, index, current);
      output += quoted.value;
      index = quoted.nextIndex;
      continue;
    }
    if (current === "[") {
      output = appendSqlSpace(output, current, pendingSpace);
      pendingSpace = false;
      const closing = source.indexOf("]", index + 1);
      const end = closing < 0 ? source.length : closing + 1;
      output += source.slice(index, end);
      index = end;
      continue;
    }
    if (current === "-" && next === "-") {
      output = appendSqlSpace(output, current, pendingSpace);
      pendingSpace = false;
      const lineEnd = source.indexOf("\n", index + 2);
      const end = lineEnd < 0 ? source.length : lineEnd;
      output += source.slice(index, end);
      index = end;
      continue;
    }
    if (current === "/" && next === "*") {
      output = appendSqlSpace(output, current, pendingSpace);
      pendingSpace = false;
      const commentEnd = source.indexOf("*/", index + 2);
      const end = commentEnd < 0 ? source.length : commentEnd + 2;
      output += source.slice(index, end);
      index = end;
      continue;
    }
    if (current === ",") {
      output = output.trimEnd() + ",\n  ";
      pendingSpace = false;
      index += 1;
      while (/\s/u.test(source[index] ?? "")) index += 1;
      continue;
    }
    const clause = clausePattern.exec(source.slice(index, index + 32));
    const atWordStart = index === 0 || !/[A-Za-z0-9_$]/u.test(source[index - 1] ?? "");
    if (clause && atWordStart) {
      const keyword = clause[0].replace(/\s+/gu, " ").toUpperCase();
      output = output.trimEnd();
      if (output) output += "\n";
      if (keyword === "AND" || keyword === "OR") output += "  ";
      output += keyword + " ";
      index += clause[0].length;
      while (/\s/u.test(source[index] ?? "")) index += 1;
      pendingSpace = false;
      continue;
    }
    output = appendSqlSpace(output, current, pendingSpace);
    pendingSpace = false;
    output += current;
    index += 1;
  }
  return output.trim();
}

function appendSqlSpace(output: string, next: string, pending: boolean) {
  const previous = output.at(-1) ?? "";
  if (!pending || !previous || /\s/u.test(previous) || "([{.,".includes(previous) || /[),.;]/u.test(next)) return output;
  return output + " ";
}

function copySqlQuoted(source: string, start: number, quote: string) {
  let value = quote;
  let index = start + 1;
  while (index < source.length) {
    const current = source[index];
    value += current;
    if (current === "\\" && index + 1 < source.length) {
      value += source[index + 1];
      index += 2;
      continue;
    }
    if (current === quote) {
      if (source[index + 1] === quote) {
        value += quote;
        index += 2;
        continue;
      }
      return { value, nextIndex: index + 1 };
    }
    index += 1;
  }
  return { value, nextIndex: index };
}

function minifySql(source: string): string {
  let output = "";
  let index = 0;
  let pendingSpace = false;
  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1] ?? "";
    if (/\s/u.test(current)) {
      pendingSpace = true;
      index += 1;
      continue;
    }
    if (current === "'" || current === "\"" || current.charCodeAt(0) === 96) {
      output = appendSqlSpace(output, current, pendingSpace);
      pendingSpace = false;
      const quoted = copySqlQuoted(source, index, current);
      output += quoted.value;
      index = quoted.nextIndex;
      continue;
    }
    if (current === "[") {
      output = appendSqlSpace(output, current, pendingSpace);
      pendingSpace = false;
      const closing = source.indexOf("]", index + 1);
      const end = closing < 0 ? source.length : closing + 1;
      output += source.slice(index, end);
      index = end;
      continue;
    }
    if (current === "-" && next === "-") {
      output = appendSqlSpace(output, current, pendingSpace);
      pendingSpace = false;
      const lineEnd = source.indexOf("\n", index + 2);
      const end = lineEnd < 0 ? source.length : lineEnd;
      output += source.slice(index, end);
      if (lineEnd >= 0) output += "\n";
      index = lineEnd < 0 ? source.length : lineEnd + 1;
      continue;
    }
    if (current === "/" && next === "*") {
      output = appendSqlSpace(output, current, pendingSpace);
      pendingSpace = false;
      const commentEnd = source.indexOf("*/", index + 2);
      const end = commentEnd < 0 ? source.length : commentEnd + 2;
      output += source.slice(index, end);
      index = end;
      pendingSpace = true;
      continue;
    }
    if (",;().".includes(current)) {
      if (",;).".includes(current)) output = output.trimEnd();
      output += current;
      pendingSpace = false;
      index += 1;
      continue;
    }
    output = appendSqlSpace(output, current, pendingSpace);
    pendingSpace = false;
    output += current;
    index += 1;
  }
  return output.trim();
}

function formatHtml(source: string): string {
  const tokens = tokenizeHtml(source);
  const lines: string[] = [];
  let depth = 0;
  for (const token of tokens) {
    const clean = token.trim();
    if (!clean) continue;
    const closing = /^<\//u.test(clean);
    if (closing) depth = Math.max(0, depth - 1);
    lines.push("  ".repeat(depth) + clean);
    if (
      /^<[A-Za-z][^>]*[^/]>$/u.test(clean) &&
      !/^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/iu.test(clean) &&
      !clean.startsWith("</")
    ) depth += 1;
  }
  return lines.join("\n");
}

function tokenizeHtml(source: string): string[] {
  const tokens: string[] = [];
  let index = 0;
  while (index < source.length) {
    if (source.startsWith("<!--", index)) {
      const end = source.indexOf("-->", index + 4);
      const nextIndex = end < 0 ? source.length : end + 3;
      tokens.push(source.slice(index, nextIndex));
      index = nextIndex;
      continue;
    }
    if (source[index] === "<") {
      const start = index;
      let quote = "";
      index += 1;
      while (index < source.length) {
        const current = source[index];
        if (quote) {
          if (current === quote && source[index - 1] !== "\\") quote = "";
        } else if (current === "\"" || current === "'") {
          quote = current;
        } else if (current === ">") {
          index += 1;
          break;
        }
        index += 1;
      }
      tokens.push(source.slice(start, index));
      continue;
    }
    const start = index;
    while (index < source.length && source[index] !== "<") index += 1;
    tokens.push(source.slice(start, index));
  }
  return tokens;
}

function formatCss(source: string): string {
  const masked = maskQuotedAndCommented(source, "css");
  const formatted = masked.value
    .replace(/\s*\{\s*/gu, " {\n  ")
    .replace(/;\s*/gu, ";\n  ")
    .replace(/\s*\}\s*/gu, "\n}\n")
    .replace(/\n {2}\n/gu, "\n")
    .trim();
  return restoreMasked(formatted, masked.literals);
}

function formatJavaScript(source: string): string {
  const masked = maskQuotedAndCommented(source, "javascript");
  let depth = 0;
  const formatted = masked.value
    .replace(/\s*\{\s*/gu, " {\n")
    .replace(/;\s*/gu, ";\n")
    .replace(/\s*\}\s*/gu, "\n}\n")
    .split("\n")
    .map((line) => {
      const clean = line.trim();
      if (clean.startsWith("}")) depth = Math.max(0, depth - 1);
      const indented = "  ".repeat(depth) + clean;
      if (clean.endsWith("{")) depth += 1;
      return indented;
    })
    .filter(Boolean)
    .join("\n");
  return restoreMasked(formatted, masked.literals);
}

function maskQuotedAndCommented(source: string, language: "css" | "javascript") {
  const literals: Array<{ token: string; value: string }> = [];
  let output = "";
  let index = 0;
  let serial = 0;
  while (index < source.length) {
    const current = source[index];
    const next = source[index + 1] ?? "";
    const isQuote = current === "'" || current === "\"" || (language === "javascript" && current.charCodeAt(0) === 96);
    const isBlockComment = current === "/" && next === "*";
    const isLineComment = language === "javascript" && current === "/" && next === "/";
    if (!isQuote && !isBlockComment && !isLineComment) {
      output += current;
      index += 1;
      continue;
    }

    const start = index;
    if (isQuote) {
      const quote = current;
      index += 1;
      while (index < source.length) {
        if (source[index] === "\\" && index + 1 < source.length) {
          index += 2;
          continue;
        }
        if (source[index] === quote) {
          index += 1;
          break;
        }
        index += 1;
      }
    } else if (isBlockComment) {
      const end = source.indexOf("*/", index + 2);
      index = end < 0 ? source.length : end + 2;
    } else {
      const end = source.indexOf("\n", index + 2);
      index = end < 0 ? source.length : end + 1;
    }
    let token = "\u0000TOOLS_DICE_LITERAL_" + serial++ + "\u0000";
    while (source.includes(token)) token += "_";
    literals.push({ token, value: source.slice(start, index) });
    output += token;
  }
  return { value: output, literals };
}

function restoreMasked(source: string, literals: Array<{ token: string; value: string }>) {
  let output = source;
  for (const literal of literals) output = output.replaceAll(literal.token, literal.value);
  return output;
}

function minifyHtml(source: string): string {
  return source.replace(/<!--(?!\[if)[\s\S]*?-->/gu, "").replace(/>\s+</gu, "><").trim();
}

function minifyCss(source: string): string {
  const withoutComments = stripCssComments(source);
  const masked = maskQuotedAndCommented(withoutComments, "css");
  const compacted = masked.value
    .replace(/\s+/gu, " ")
    .replace(/\s*([{}:;,])\s*/gu, "$1")
    .replace(/;\}/gu, "}")
    .trim();
  return restoreMasked(compacted, masked.literals);
}

function stripCssComments(source: string): string {
  let output = "";
  let index = 0;
  let quote = "";
  while (index < source.length) {
    const current = source[index];
    if (quote) {
      output += current;
      if (current === "\\" && index + 1 < source.length) {
        output += source[index + 1];
        index += 2;
        continue;
      }
      if (current === quote) quote = "";
      index += 1;
      continue;
    }
    if (current === "'" || current === "\"") {
      quote = current;
      output += current;
      index += 1;
      continue;
    }
    if (current === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end < 0 ? source.length : end + 2;
      output += " ";
      continue;
    }
    output += current;
    index += 1;
  }
  return output;
}

function minifyJavaScript(source: string): string {
  return compactOutsideStrings(source);
}

function compactOutsideStrings(source: string): string {
  let output = "";
  let quote = "";
  let escaped = false;
  let pendingSpace = false;
  let pendingLineBreak = false;
  for (let index = 0; index < source.length; index += 1) {
    const current = source[index];
    const next = source[index + 1] ?? "";
    if (quote) {
      output += current;
      if (escaped) escaped = false;
      else if (current === "\\") escaped = true;
      else if (current === quote) quote = "";
      continue;
    }
    if (current === "'" || current === "\"" || current.charCodeAt(0) === 96) {
      if (pendingSpace && needsSeparator(output.at(-1) ?? "", current)) output += " ";
      pendingSpace = false;
      quote = current;
      output += current;
      continue;
    }
    if (current === "/" && next === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      pendingSpace = true;
      pendingLineBreak = true;
      continue;
    }
    if (current === "/" && next === "*") {
      const commentStart = index;
      index += 2;
      while (index < source.length && !(source[index] === "*" && source[index + 1] === "/")) index += 1;
      const hasLineBreak = /[\r\n]/u.test(source.slice(commentStart, Math.min(source.length, index + 2)));
      index = Math.min(source.length, index + 1);
      pendingSpace = true;
      pendingLineBreak ||= hasLineBreak;
      continue;
    }
    if (/\s/u.test(current)) {
      pendingSpace = true;
      if (current === "\n" || current === "\r") pendingLineBreak = true;
      continue;
    }
    const previous = output.at(-1) ?? "";
    if (pendingSpace && pendingLineBreak) output += "\n";
    else if (pendingSpace && needsSeparator(previous, current)) output += " ";
    pendingSpace = false;
    pendingLineBreak = false;
    output += current;
  }
  return output.trim();
}

function needsSeparator(previous: string, current: string) {
  if (!previous || !current) return false;
  if (/[\w$]/u.test(previous) && /[\w$]/u.test(current)) return true;
  if (/[+-]/u.test(previous) && /[+-]/u.test(current)) return true;
  if (previous === "/" && (current === "/" || current === "*")) return true;
  return false;
}

import re


def extract_label(line: str):
    """
    Extract the label content from a node definition line.
    Input:  'Node0x5bea79575b90 [shape=record,shape=Mrecord,label="{EntryToken|t0|{<d0>ch|<d1>glue}}"];'
    Output: '{EntryToken|t0|{<d0>ch|<d1>glue}}'
    """
    match = re.search(r'label="([^"]+)"', line)
    if match:
        return match.group(1)
    return ""


def parse_label(label: str):
    """
    Parse the label to extract opcode, node number, and output type.
    Examples:
    "{EntryToken|t0|{<d0>ch|<d1>glue}}" → ("EntryToken", "t0", "ch")
    "{Register %8|t1|{<d0>i32}}" → ("Register %8", "t1", "i32")
    "{{<s0>0|<s1>1}|add|t6|{<d0>i32}}" → ("add", "t6", "i32")
    """
    # Pattern 1: Simple node {Opcode|tN|{outputs}}
    # Example: {EntryToken|t0|{<d0>ch|<d1>glue}}
    match = re.match(r'\{([^{|]+)\|t(\d+)\|.*?<d\d+>([^}|]+)', label)
    if match:
        return (match.group(1), f"t{match.group(2)}", match.group(3))

    # Pattern 2: Node with inputs {{inputs}|Opcode|tN|{outputs}}
    # Example: {{<s0>0|<s1>1}|add|t6|{<d0>i32}}
    match = re.match(r'\{\{.*?\}\|([^|]+)\|t(\d+)\|.*?<d\d+>([^}|]+)', label)
    if match:
        return (match.group(1), f"t{match.group(2)}", match.group(3))

    # Fallback
    return (label, "t?", "?")


def parse_dot(dot_file_path: str):
    """
        # Opens the .dot file
        # Parses the GraphViz DOT syntax
        # Extracts:
        #   - Nodes: {id, label (opcode), type, etc.}
        #   - Edges: {source, target, type}
    # Returns: JSON structure for React Flow
    """
    nodes = []
    edges = []

    with open(dot_file_path, "r") as f:
        for line in f:
            if '[shape=record' in line:
                # Node definition
                node_id = line.split()[0]                               # Node0x5bea79575b90
                label = extract_label(line)                             # label="{EntryToken|t0|{<d0>ch|<d1>glue}}"];
                opcode, node_num, output_type = parse_label(label)
                nodes.append({
                    "id": node_id,
                    "position": {"x": 0, "y": 0},
                    "data": {
                        "label": opcode,
                        "opcode": opcode,
                        "node_num": node_num,
                        "output_type": output_type
                    }
                })
            elif '->' in line:
                # Edge definition
                # DOT format: "targetNode:inputPort -> sourceNode:outputPort"
                parts = line.split('->')
                target = parts[0].split(':')[0].strip()                 # Left side is actually target
                source = parts[1].split(':')[0].strip()                 # Right side is actually source

                # Determine edge type from color
                is_chain = 'color=blue' in line                         # Chain edges (ordering)
                is_glue = 'color=red' in line                           # Glue edges (special dependencies)

                edge_type = "glue" if is_glue else ("chain" if is_chain else "data")

                edges.append({
                    "id": f"{source}->{target}",
                    "source": source,
                    "target": target,
                    "type": edge_type
                })

    return {"nodes": nodes, "edges": edges}
const FISH = `# xp fish completions
complete -c xp -f

# Subcommands
complete -c xp -n '__fish_use_subcommand' -a tweet -d 'Post a tweet'
complete -c xp -n '__fish_use_subcommand' -a thread -d 'Post a thread'
complete -c xp -n '__fish_use_subcommand' -a delete -d 'Delete a tweet'
complete -c xp -n '__fish_use_subcommand' -a auth -d 'Authentication'
complete -c xp -n '__fish_use_subcommand' -a config -d 'Manage config'
complete -c xp -n '__fish_use_subcommand' -a completions -d 'Generate shell completions'
complete -c xp -n '__fish_use_subcommand' -a help -d 'Show help'
complete -c xp -n '__fish_use_subcommand' -a version -d 'Show version'

# auth subcommands
complete -c xp -n '__fish_seen_subcommand_from auth' -a login -d 'Authenticate via browser'
complete -c xp -n '__fish_seen_subcommand_from auth' -a logout -d 'Remove saved credentials'

# config subcommands
complete -c xp -n '__fish_seen_subcommand_from config' -a set -d 'Set API credentials'
complete -c xp -n '__fish_seen_subcommand_from config' -a show -d 'Show current config'

# config set flags
complete -c xp -n '__fish_seen_subcommand_from set' -l api-key -d 'API Key'
complete -c xp -n '__fish_seen_subcommand_from set' -l api-secret -d 'API Secret'
complete -c xp -n '__fish_seen_subcommand_from set' -l access-token -d 'Access Token'
complete -c xp -n '__fish_seen_subcommand_from set' -l access-token-secret -d 'Access Token Secret'

# completions subcommands
complete -c xp -n '__fish_seen_subcommand_from completions' -a 'fish bash zsh' -d 'Shell type'
`;

const BASH = `# xp bash completions
_xp() {
    local cur prev commands
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    commands="tweet thread delete auth config completions help version"

    case "\${prev}" in
        xp)
            COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
            ;;
        auth)
            COMPREPLY=( $(compgen -W "login logout" -- "\${cur}") )
            ;;
        config)
            COMPREPLY=( $(compgen -W "set show" -- "\${cur}") )
            ;;
        completions)
            COMPREPLY=( $(compgen -W "fish bash zsh" -- "\${cur}") )
            ;;
        set)
            COMPREPLY=( $(compgen -W "--api-key= --api-secret= --access-token= --access-token-secret=" -- "\${cur}") )
            ;;
    esac
}
complete -F _xp xp
`;

const ZSH = `#compdef xp
# xp zsh completions

_xp() {
    local -a commands
    commands=(
        'tweet:Post a tweet'
        'thread:Post a thread'
        'delete:Delete a tweet'
        'auth:Authentication'
        'config:Manage config'
        'completions:Generate shell completions'
        'help:Show help'
        'version:Show version'
    )

    _arguments -C \\
        '1:command:->command' \\
        '*::arg:->args'

    case "\$state" in
        command)
            _describe 'command' commands
            ;;
        args)
            case "\${words[1]}" in
                auth)
                    _values 'subcommand' 'login[Authenticate via browser]' 'logout[Remove saved credentials]'
                    ;;
                config)
                    _values 'subcommand' 'set[Set API credentials]' 'show[Show current config]'
                    ;;
                completions)
                    _values 'shell' 'fish' 'bash' 'zsh'
                    ;;
            esac
            ;;
    esac
}

_xp
`;

export function completionsCommand(shell: string): void {
  switch (shell) {
    case "fish":
      console.log(FISH);
      break;
    case "bash":
      console.log(BASH);
      break;
    case "zsh":
      console.log(ZSH);
      break;
    default:
      throw new Error(`Unsupported shell: ${shell}\nUsage: xp completions fish|bash|zsh`);
  }
}

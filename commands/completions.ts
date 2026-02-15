const FISH = `# xp fish completions
complete -c xp -f

# Subcommands
complete -c xp -n '__fish_use_subcommand' -a tweet -d 'Post a tweet'
complete -c xp -n '__fish_use_subcommand' -a thread -d 'Post a thread'
complete -c xp -n '__fish_use_subcommand' -a reply -d 'Reply to a tweet'
complete -c xp -n '__fish_use_subcommand' -a get -d 'Fetch a tweet by ID'
complete -c xp -n '__fish_use_subcommand' -a me -d 'List your recent tweets'
complete -c xp -n '__fish_use_subcommand' -a delete -d 'Delete a tweet'
complete -c xp -n '__fish_use_subcommand' -a cache -d 'Manage tweet cache'
complete -c xp -n '__fish_use_subcommand' -a auth -d 'Authentication'
complete -c xp -n '__fish_use_subcommand' -a config -d 'Manage config'
complete -c xp -n '__fish_use_subcommand' -a upgrade -d 'Upgrade to latest version'
complete -c xp -n '__fish_use_subcommand' -a completions -d 'Generate shell completions'
complete -c xp -n '__fish_use_subcommand' -a help -d 'Show help'
complete -c xp -n '__fish_use_subcommand' -a version -d 'Show version'

# auth subcommands
complete -c xp -n '__fish_seen_subcommand_from auth' -a login -d 'Authenticate via browser'
complete -c xp -n '__fish_seen_subcommand_from auth' -a logout -d 'Remove saved credentials'

# me flags
complete -c xp -n '__fish_seen_subcommand_from me' -l limit -d 'Number of tweets to fetch'
complete -c xp -n '__fish_seen_subcommand_from me' -l before -d 'Fetch tweets older than this ID'
complete -c xp -n '__fish_seen_subcommand_from me' -l after -d 'Fetch tweets newer than this ID'

# cache subcommands
complete -c xp -n '__fish_seen_subcommand_from cache' -a list -d 'List cached tweets'
complete -c xp -n '__fish_seen_subcommand_from cache' -a show -d 'Show a cached tweet'
complete -c xp -n '__fish_seen_subcommand_from cache' -a clear -d 'Clear all cached tweets'

# cache list flags
complete -c xp -n '__fish_seen_subcommand_from list' -l limit -d 'Number of cached tweets to show'
complete -c xp -n '__fish_seen_subcommand_from list' -l year -d 'Filter by year (e.g. 2026)'
complete -c xp -n '__fish_seen_subcommand_from list' -l month -d 'Filter by month (1-12, requires --year)'

# config subcommands
complete -c xp -n '__fish_seen_subcommand_from config' -a set -d 'Set API credentials'
complete -c xp -n '__fish_seen_subcommand_from config' -a unset -d 'Unset config values'
complete -c xp -n '__fish_seen_subcommand_from config' -a show -d 'Show current config'

# config set flags
complete -c xp -n '__fish_seen_subcommand_from set' -l api-key -d 'API Key'
complete -c xp -n '__fish_seen_subcommand_from set' -l api-secret -d 'API Secret'
complete -c xp -n '__fish_seen_subcommand_from set' -l access-token -d 'Access Token'
complete -c xp -n '__fish_seen_subcommand_from set' -l access-token-secret -d 'Access Token Secret'
complete -c xp -n '__fish_seen_subcommand_from set' -l cache-dir -d 'Custom cache directory'

# config unset flags
complete -c xp -n '__fish_seen_subcommand_from unset' -l cache-dir -d 'Reset cache directory to default'

# Global flags
complete -c xp -l json -d 'Output in JSON format'
complete -c xp -l image -r -F -d 'Attach image file (max 4)'

# completions subcommands
complete -c xp -n '__fish_seen_subcommand_from completions' -a 'fish bash zsh' -d 'Shell type'
`;

const BASH = `# xp bash completions
_xp() {
    local cur prev commands
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    commands="tweet thread reply get me delete cache auth config upgrade completions help version"

    case "\${prev}" in
        xp)
            COMPREPLY=( $(compgen -W "\${commands}" -- "\${cur}") )
            ;;
        auth)
            COMPREPLY=( $(compgen -W "login logout" -- "\${cur}") )
            ;;
        me)
            COMPREPLY=( $(compgen -W "--limit --before --after --json" -- "\${cur}") )
            ;;
        cache)
            COMPREPLY=( $(compgen -W "list show clear" -- "\${cur}") )
            ;;
        list)
            COMPREPLY=( $(compgen -W "--limit --year --month --json" -- "\${cur}") )
            ;;
        config)
            COMPREPLY=( $(compgen -W "set unset show" -- "\${cur}") )
            ;;
        completions)
            COMPREPLY=( $(compgen -W "fish bash zsh" -- "\${cur}") )
            ;;
        set)
            COMPREPLY=( $(compgen -W "--api-key= --api-secret= --access-token= --access-token-secret= --cache-dir=" -- "\${cur}") )
            ;;
        unset)
            COMPREPLY=( $(compgen -W "--cache-dir" -- "\${cur}") )
            ;;
        tweet|thread|reply)
            COMPREPLY=( $(compgen -W "--json --image" -- "\${cur}") )
            ;;
        --image)
            COMPREPLY=( $(compgen -f -- "\${cur}") )
            ;;
        get|delete)
            COMPREPLY=( $(compgen -W "--json" -- "\${cur}") )
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
        'reply:Reply to a tweet'
        'get:Fetch a tweet by ID'
        'me:List your recent tweets'
        'delete:Delete a tweet'
        'cache:Manage tweet cache'
        'auth:Authentication'
        'config:Manage config'
        'upgrade:Upgrade to latest version'
        'completions:Generate shell completions'
        'help:Show help'
        'version:Show version'
    )

    _arguments -C \\
        '--json[Output in JSON format]' \\
        '*--image[Attach image file]:file:_files -g "*.{jpg,jpeg,png,gif,webp}"' \\
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
                me)
                    _arguments '--limit[Number of tweets to fetch]:count:' '--before[Fetch tweets older than this ID]:tweet_id:' '--after[Fetch tweets newer than this ID]:tweet_id:' '--json[Output in JSON format]'
                    ;;
                cache)
                    case "\${words[2]}" in
                        list)
                            _arguments '--limit[Number of cached tweets to show]:count:' '--year[Filter by year]:year:' '--month[Filter by month (1-12)]:month:' '--json[Output in JSON format]'
                            ;;
                        *)
                            _values 'subcommand' 'list[List cached tweets]' 'show[Show a cached tweet]' 'clear[Clear all cached tweets]'
                            ;;
                    esac
                    ;;
                config)
                    _values 'subcommand' 'set[Set API credentials]' 'unset[Unset config values]' 'show[Show current config]'
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

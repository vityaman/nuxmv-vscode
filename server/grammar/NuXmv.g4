grammar NuXmv;

program
    : module* EOF
    ;

module
    : MODULE IDENT ( LPAREN moduleParameters? RPAREN )? moduleBody
    ;

moduleParameters
    : IDENT ( COMMA IDENT )*
    ;

moduleBody
    : moduleElement*
    ;

moduleElement
    : varDeclaration
    | ivarDeclaration
    | frozenvarDeclaration
    | functionDeclaration
    | defineDeclaration
    | constantsDeclaration
    | assignConstraint
    | transConstraint
    | initConstraint
    | invarConstraint
    | fairnessConstraint
    | timeDomainAnnotation
    | ctlSpecification
    | invarSpecification
    | ltlSpecification
    | rtctlSpecification
    | computeSpecification
    | pslspecDeclaration
    | predDeclaration
    | mirrorDeclaration
    | isaDeclaration
    ;

varDeclaration
    : VAR varList
    ;

ivarDeclaration
    : IVAR simpleVarList
    ;

frozenvarDeclaration
    : FROZENVAR simpleVarList
    ;

functionDeclaration
    : FUN functionDeclItem+
    ;

functionDeclItem
    : complexIdentifier COLON functionTypeSpecifier SEMI
    ;

functionTypeSpecifier
    : functionArgsTypeSpecifier ARROW simpleTypeSpecifier
    ;

functionArgsTypeSpecifier
    : simpleTypeSpecifier ( STAR simpleTypeSpecifier )*
    ;

defineDeclaration
    : DEFINE defineBody
    ;

defineBody
    : defineItem+
    ;

defineItem
    : complexIdentifier ASSIGN_OP expr SEMI
    ;

constantsDeclaration
    : CONSTANTS constantsBody SEMI
    ;

constantsBody
    : complexIdentifier ( COMMA complexIdentifier )*
    ;

varList
    : varItem+
    ;

varItem
    : complexIdentifier COLON typeSpecifier SEMI
    ;

simpleVarList
    : simpleVarItem+
    ;

simpleVarItem
    : complexIdentifier COLON simpleTypeSpecifier SEMI
    ;

typeSpecifier
    : simpleTypeSpecifier
    | moduleTypeSpecifier
    | processTypeSpecifier
    ;

simpleTypeSpecifier
    : BOOLEAN_KW
    | INTEGER_KW
    | REAL_KW
    | CLOCK_KW
    | WORD LBRACK simpleExpr RBRACK
    | UNSIGNED WORD LBRACK simpleExpr RBRACK
    | SIGNED WORD LBRACK simpleExpr RBRACK
    | LBRACE enumerationTypeBody RBRACE
    | simpleExpr DOT DOT simpleExpr
    | ARRAY simpleExpr DOT DOT simpleExpr OF simpleTypeSpecifier
    ;

enumerationTypeBody
    : enumerationTypeValue ( COMMA enumerationTypeValue )*
    ;

enumerationTypeValue
    : symbolicConstant
    | integerNumber
    ;

moduleTypeSpecifier
    : IDENT ( LPAREN parameterList? RPAREN )?
    ;

processTypeSpecifier
    : PROCESS moduleTypeSpecifier
    ;

parameterList
    : simpleExpr ( COMMA simpleExpr )*
    ;

assignConstraint
    : ASSIGN assignList
    ;

assignList
    : assignItem+
    ;

assignItem
    : complexIdentifier ASSIGN_OP simpleExpr SEMI
    | INIT LPAREN complexIdentifier RPAREN ASSIGN_OP simpleExpr SEMI
    | NEXT LPAREN complexIdentifier RPAREN ASSIGN_OP nextExpr SEMI
    ;

transConstraint
    : TRANS nextExpr SEMI?
    ;

initConstraint
    : INIT simpleExpr SEMI?
    ;

invarConstraint
    : INVAR simpleExpr SEMI?
    | INVAR simpleExpr ARROW simpleExpr SEMI?
    ;

fairnessConstraint
    : FAIRNESS simpleExpr SEMI?
    | JUSTICE simpleExpr SEMI?
    | COMPASSION LPAREN simpleExpr COMMA simpleExpr RPAREN SEMI?
    ;

timeDomainAnnotation
    : AT TIME DOMAIN timeDomain
    ;

timeDomain
    : NONE
    | CONTINUOUS
    ;

isaDeclaration
    : ISA IDENT SEMI
    ;

predDeclaration
    : PRED simpleExpr SEMI?
    | PRED LT IDENT GT ASSIGN_OP simpleExpr SEMI?
    ;

mirrorDeclaration
    : MIRROR variableIdentifier SEMI
    ;

ctlSpecification
    : CTLSPEC ctlExpr SEMI
    | SPEC ctlExpr SEMI?
    | CTLSPEC NAME IDENT ASSIGN_OP ctlExpr SEMI
    | SPEC NAME IDENT ASSIGN_OP ctlExpr SEMI?
    ;

invarSpecification
    : INVARSPEC nextExpr SEMI
    | INVARSPEC NAME IDENT ASSIGN_OP nextExpr SEMI
    | SPEC AG nextExpr SEMI
    ;

ltlSpecification
    : LTLSPEC ltlExpr SEMI?
    | LTLSPEC NAME IDENT ASSIGN_OP ltlExpr SEMI?
    ;

rtctlSpecification
    : CTLSPEC rtctlExpr SEMI?
    | SPEC rtctlExpr SEMI?
    | CTLSPEC NAME IDENT ASSIGN_OP rtctlExpr SEMI
    | SPEC NAME IDENT ASSIGN_OP rtctlExpr SEMI?
    ;

computeSpecification
    : COMPUTE computeExpr SEMI?
    | COMPUTE NAME IDENT ASSIGN_OP computeExpr SEMI?
    ;

computeExpr
    : MIN LBRACK rtctlExpr COMMA rtctlExpr RBRACK
    | MAX LBRACK rtctlExpr COMMA rtctlExpr RBRACK
    ;

pslspecDeclaration
    : PSLSPEC pslExpr SEMI
    | PSLSPEC NAME IDENT ASSIGN_OP pslExpr SEMI
    ;

pslExpr
    : expr
    ;

complexIdentifier
    : IDENT
    | complexIdentifier DOT IDENT
    | complexIdentifier LBRACK simpleExpr RBRACK
    | SELF
    ;

variableIdentifier
    : complexIdentifier
    ;

defineIdentifier
    : complexIdentifier
    ;

symbolicConstant
    : complexIdentifier
    ;

integerNumber
    : MINUS? POS_INT
    ;

constant
    : booleanConstant
    | integerNumber
    | realConstant
    | symbolicConstant
    | wordConstant
    | rangeConstant
    ;

booleanConstant
    : FALSE
    | TRUE
    ;

realConstant
    : floatNumber
    | FRACTIONAL_LIT
    | SCIENTIFIC_LIT
    ;

floatNumber
    : POS_INT DOT POS_INT
    | MINUS POS_INT DOT POS_INT
    ;

wordConstant
    : WORD_CONST
    ;

rangeConstant
    : integerNumber DOT DOT integerNumber
    ;

simpleExpr
    : expr
    ;

nextExpr
    : expr
    ;

extExpr
    : expr
    ;

expr
    : expr QUEST expr COLON expr
    | expr ( ARROW | IFF ) expr
    | expr ( OR | PIPE ) expr
    | expr ( XOR | XNOR ) expr
    | expr AND expr
    | expr ( EQ | NEQ | LT | GT | LE | GE ) expr
    | expr ( SHR | SHL ) expr
    | expr ( PLUS | MINUS ) expr
    | expr ( STAR | DIV | MOD ) expr
    | expr UNION expr
    | expr IN_KW expr
    | expr COLON COLON expr
    | expr LBRACK index RBRACK
    | expr LBRACK integerNumber COLON integerNumber RBRACK
    | <assoc=right> ( NOT | MINUS | PLUS ) expr
    | primary
    ;

index
    : simpleExpr
    ;

primary
    : constant
    | complexIdentifier
    | LPAREN expr RPAREN
    | PI
    | abs=ABS LPAREN expr RPAREN
    | max=MAX LPAREN expr COMMA expr RPAREN
    | min=MIN LPAREN expr COMMA expr RPAREN
    | sin=SIN LPAREN expr RPAREN
    | cos=COS LPAREN expr RPAREN
    | exp=EXP LPAREN expr RPAREN
    | tan=TAN LPAREN expr RPAREN
    | ln=LN LPAREN expr RPAREN
    | pow=POW LPAREN expr COMMA simpleExpr RPAREN
    | asin=ASIN LPAREN expr RPAREN
    | acos=ACOS LPAREN expr RPAREN
    | atan=ATAN LPAREN expr RPAREN
    | sqrt=SQRT LPAREN expr RPAREN
    | WORD1 LPAREN expr RPAREN
    | BOOL LPAREN expr RPAREN
    | TOINT LPAREN expr RPAREN
    | SIGNED LPAREN expr RPAREN
    | UNSIGNED LPAREN expr RPAREN
    | EXTEND LPAREN expr COMMA expr RPAREN
    | RESIZE LPAREN expr COMMA expr RPAREN
    | COUNT LPAREN exprList RPAREN
    | FLOOR LPAREN expr RPAREN
    | NEXT LPAREN expr RPAREN
    | caseExpr
    | LBRACE setBody RBRACE
    | functionCall
    ;

exprList
    : expr ( COMMA expr )*
    ;

setBody
    : expr ( COMMA expr )*
    ;

functionCall
    : IDENT LPAREN ( exprList )? RPAREN
    ;

caseExpr
    : CASE caseBody ESAC
    ;

caseBody
    : ( expr COLON expr SEMI )+ ( expr QUEST expr COLON expr )?
    ;

ctlExpr
    : simpleExpr
    | LPAREN ctlExpr RPAREN
    | NOT ctlExpr
    | ctlExpr ( AND | OR | PIPE | XOR | XNOR | ARROW | IFF ) ctlExpr
    | EG ctlExpr
    | EX ctlExpr
    | EF ctlExpr
    | AG ctlExpr
    | AX ctlExpr
    | AF ctlExpr
    | CTL_E LBRACK ctlExpr CTL_U ctlExpr RBRACK
    | CTL_A LBRACK ctlExpr CTL_U ctlExpr RBRACK
    ;

ltlExpr
    : nextExpr
    | LPAREN ltlExpr RPAREN
    | NOT ltlExpr
    | ltlExpr ( AND | OR | PIPE | XOR | XNOR | ARROW | IFF ) ltlExpr
    | LTL_X ltlExpr
    | LTL_G ltlExpr
    | LTL_F ltlExpr
    | ltlExpr CTL_U ltlExpr
    | ltlExpr LTL_V ltlExpr
    | ltlExpr AT_F ltlExpr
    | TIME_UNTIL LPAREN nextExpr RPAREN
    | LTL_Y ltlExpr
    | LTL_Z ltlExpr
    | LTL_H ltlExpr
    | LTL_O ltlExpr
    | ltlExpr LTL_S ltlExpr
    | ltlExpr LTL_T ltlExpr
    | ltlExpr AT_O ltlExpr
    | TIME_SINCE LPAREN nextExpr RPAREN
    ;

rtctlExpr
    : ctlExpr
    | EBF range rtctlExpr
    | ABF range rtctlExpr
    | EBG range rtctlExpr
    | ABG range rtctlExpr
    | CTL_A LBRACK rtctlExpr BU range rtctlExpr RBRACK
    | CTL_E LBRACK rtctlExpr BU range rtctlExpr RBRACK
    ;

range
    : integerNumber DOT DOT integerNumber
    ;

WS
    : [ \t\r\n]+ -> channel(HIDDEN)
    ;

LINE_COMMENT
    : '--' ~[\r\n]* -> channel(HIDDEN)
    ;

BLOCK_COMMENT
    : '/*' ( . | '\r'? '\n' )*? '*/' -> channel(HIDDEN)
    ;

fragment A:('a'|'A');
fragment B:('b'|'B');
fragment C:('c'|'C');
fragment D:('d'|'D');
fragment E:('e'|'E');
fragment F:('f'|'F');
fragment G:('g'|'G');
fragment H:('h'|'H');
fragment I:('i'|'I');
fragment J:('j'|'J');
fragment K:('k'|'K');
fragment L:('l'|'L');
fragment M:('m'|'M');
fragment N:('n'|'N');
fragment O:('o'|'O');
fragment P:('p'|'P');
fragment Q:('q'|'Q');
fragment R:('r'|'R');
fragment S:('s'|'S');
fragment T:('t'|'T');
fragment U:('u'|'U');
fragment V:('v'|'V');
fragment W:('w'|'W');
fragment X:('x'|'X');
fragment Y:('y'|'Y');
fragment Z:('z'|'Z');

COMPASSION  : C O M P A S S I O N ;
CONTINUOUS  : C O N T I N U O U S ;
FROZENVAR   : F R O Z E N V A R ;
CONSTANTS   : C O N S T A N T S ;
INVARSPEC   : I N V A R S P E C ;
TIME_UNTIL  : T I M E '_' U N T I L ;
TIME_SINCE  : T I M E '_' S I N C E ;
UNSIGNED    : U N S I G N E D ;
FAIRNESS    : F A I R N E S S ;
BOOLEAN_KW  : B O O L E A N ;
INTEGER_KW  : I N T E G E R ;
CTLSPEC     : C T L S P E C ;
LTLSPEC     : L T L S P E C ;
PSLSPEC     : P S L S P E C ;
JUSTICE     : J U S T I C E ;
COMPUTE     : C O M P U T E ;
PROCESS     : P R O C E S S ;
ARRAY       : A R R A Y ;
ASSIGN      : A S S I G N ;
DEFINE      : D E F I N E ;
EXTEND      : E X T E N D ;
MODULE      : M O D U L E ;
MIRROR      : M I R R O R ;
RESIZE      : R E S I Z E ;
SIGNED      : S I G N E D ;
TRANS       : T R A N S ;
DOMAIN      : D O M A I N ;
INVAR       : I N V A R ;
COUNT       : C O U N T ;
CLOCK_KW    : C L O C K ;
FLOOR       : F L O O R ;
TOINT       : T O I N T ;
UNION       : U N I O N ;
WORD1       : W O R D '1' ;
XNOR        : X N O R ;
ASIN        : A S I N ;
ACOS        : A C O S ;
ATAN        : A T A N ;
SQRT        : S Q R T ;
CASE        : C A S E ;
ESAC        : E S A C ;
FALSE       : F A L S E ;
INIT        : I N I T ;
IVAR        : I V A R ;
NAME        : N A M E ;
NEXT        : N E X T ;
PRED        : P R E D ;
SELF        : S E L F ;
SPEC        : S P E C ;
TRUE        : T R U E ;
BOOL        : B O O L ;
WORD        : W O R D ;
REAL_KW     : R E A L ;
TIME        : T I M E ;
NONE        : N O N E ;
EBF         : E B F ;
EBG         : E B G ;
ABF         : A B F ;
ABG         : A B G ;
COS         : C O S ;
EXP         : E X P ;
MAX         : M A X ;
MIN         : M I N ;
POW         : P O W ;
SIN         : S I N ;
TAN         : T A N ;
FUN         : F U N ;
ISA         : I S A ;
MOD         : M O D ;
XOR         : X O R ;
VAR         : V A R ;
ABS         : A B S ;
LN          : L N ;
BU          : B U ;
EG          : E G ;
EX          : E X ;
EF          : E F ;
AG          : A G ;
AX          : A X ;
AF          : A F ;
OR          : O R ;
OF          : O F ;
PI          : P I ;
IN_KW       : I N ;

CTL_E       : 'E' ;
CTL_A       : 'A' ;
CTL_U       : 'U' ;
LTL_X       : 'X' ;
LTL_G       : 'G' ;
LTL_F       : 'F' ;
LTL_V       : 'V' ;
LTL_Y       : 'Y' ;
LTL_Z       : 'Z' ;
LTL_H       : 'H' ;
LTL_O       : 'O' ;
LTL_S       : 'S' ;
LTL_T       : 'T' ;

AT          : '@' ;

ARROW       : '->' ;
IFF         : '<->' ;
PIPE        : '|' ;
AND         : '&' ;
NOT         : '!' ;
EQ          : '=' ;
NEQ         : '!=' ;
LT          : '<' ;
GT          : '>' ;
LE          : '<=' ;
GE          : '>=' ;
SHR         : '>>' ;
SHL         : '<<' ;
PLUS        : '+' ;
MINUS       : '-' ;
STAR        : '*' ;
DIV         : '/' ;
QUEST       : '?' ;
COLON       : ':' ;
DOT         : '.' ;
COMMA       : ',' ;
SEMI        : ';' ;
LPAREN      : '(' ;
RPAREN      : ')' ;
LBRACK      : '[' ;
RBRACK      : ']' ;
LBRACE      : '{' ;
RBRACE      : '}' ;
ASSIGN_OP   : ':=' ;

QUOTE       : '\'' ;
UNDERSCORE  : '_' ;

AT_F        : '@' F '~' ;
AT_O        : '@' O '~' ;

SCIENTIFIC_LIT
    : '-'? [0-9]+ '.' [0-9]+ [eE] [+-]? [0-9]+
    | '-'? [0-9]+ [eE] [+-]? [0-9]+
    ;

FRACTIONAL_LIT
    : [fF] '\'' [0-9]+ '/' [0-9]+
    ;

WORD_CONST
    : '0' [us]? [bBoOdDhH] [0-9]* '_' [0-9a-fA-F]+
    ;

POS_INT     : [0-9]+ ;

IDENT
    : [A-Za-z_] [A-Za-z0-9$#_-]*
    ;

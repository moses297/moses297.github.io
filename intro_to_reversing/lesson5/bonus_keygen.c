#include <stdio.h>
#include <string.h>

char obf_flag[] = {97,107,102,96,124,101,104,105,114,116,88,115,110,106,98,122,0};

int check_key(const char *key) {
    int len = strlen(key);
    if (len != 8) return 0;

    int sum = 0;
    for (int i = 0; i < len; i++) {
        sum += (unsigned char)key[i];
    }
	printf("%d\n", sum);

    return (sum == 800 && key[len - 1] == 'X');
}

void print_flag() {
    char flag[sizeof(obf_flag)];
    for (int i = 0; i < sizeof(obf_flag); i++) {
        flag[i] = obf_flag[i] ^ 7; // XOR deobfuscation
    }
    printf("Your flag is: %s\n", flag);
}

int main() {
    char input[128];

    printf("Enter key: ");
    scanf("%127s", input);

    if (check_key(input)) {
        printf("Valid key! Access granted.\n");
        print_flag();
    } else {
        printf("Invalid key! Try again.\n");
    }

    return 0;
}
